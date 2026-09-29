---
layout: post
title: Trending is not a fact
tags:
- data
- systems
summary: A live chart of trending artists, and every place the pipeline quietly decided what counted.
---

<!--
DRAFT NOTES (delete before publishing)
Source: github.com/fadhilmch/streaming-twitter-spotify-trending-artists (KTH ID2221, Oct 2019)
- All behaviour described is read from the code, not from running it.
- Co-author: M. Irfan Handarbeni. Confirm he is happy to be named.
- Voice: written as if in 2021, about 18 months after the project (early in the Traveloka ML role).
  No references to anything after 2021.
- Publication date: backdate (e.g. 2021-04) or today's date with 'written in 2021'. Backdating implies it was published then.
- Unverified: whether the dashboard window was off by the UTC/Stockholm offset. The tweet
  timestamps are UTC; the dashboard builds its window from naive local now(). How Cassandra
  reads a timestamp string without a zone decides it. Check before mentioning; not in the text yet.
- Add: the architecture diagram, and the GIF from assets/ or the YouTube recording.
-->

In autumn 2019, Irfan Handarbeni and I built a live chart of the artists people were sharing on Twitter. Tweets containing a Spotify link went into Kafka. Spark Streaming asked the Spotify API who the artist was, Cassandra stored the counts, and a Dash page redrew the top twenty every five seconds.

It worked, and [the recording](https://youtu.be/eLnKT_aGahk) looks convincing: bars grow, artists move up and down. Reading the code again a year and a half later, I see a chart whose title says "trending artists" and whose pipeline answers a narrower question.

## What the chart actually counted

Here is the path of one tweet, with each decision the code makes along the way.

```text
Twitter stream ── keyword "spotify com", language "en"
      │           keep only created_at and the first expanded URL
      ▼
Kafka topic
      │
      ▼
Spark, 30-second batches
      │  URL must contain track/ ............ albums, playlists, podcasts dropped
      │  Spotify API: track → artists[0] .... featured artists dropped
      │  API error → None → filtered ........ failures dropped silently
      ▼
Cassandra  (artist, created_at to the second) → count = 1
      │
      ▼
Dash, every 5 s: SUM(count) over the last 60 minutes, top 20
```

Put together, the chart counts English-language tweets whose first link is a single Spotify track, credited to the track's first-listed artist, for which the API call succeeded.

That's a reasonable thing to measure. It just isn't "trending", and none of those conditions are visible on the page.

## Each filter has a bias

None of these filters is wrong on its own. Each one leans in a particular direction, though.

- **Language.** The English filter uses Twitter's own language detection. Listeners who tweet in other languages disappear, and so do many artists whose fans mostly write in Spanish, Portuguese or Korean.
- **First link only.** A tweet sharing two tracks counts once, for the first.
- **First artist only.** A collaboration counts only for whoever Spotify lists first. Featured artists never appear, even when the feature is the reason people share it.
- **Tracks only.** Sharing an album or a playlist is also a sign of interest, but the pipeline only recognises single tracks.
- **Retweets count.** We kept no tweet id, so a retweet is indistinguishable from someone sharing the song themselves. One large account can move the chart by itself.
- **Silent failures.** When the Spotify call failed because of a rate limit, a timeout or an unknown track, the record became `None` and was filtered out. The chart can't tell "nobody shared this" from "we couldn't look it up".

That last point is the one I'd warn anyone about. A pipeline that drops failures without counting them makes its own error rate invisible. The fix is cheap: count the drops and put the number on the page.

## The schema changed the numbers

This is the subtlest problem, and I only saw it on rereading.

```sql
CREATE TABLE artistshare (
  created_at timestamp, artist text, count int,
  PRIMARY KEY (artist, created_at)
);
```

Each tweet was written as a row with `count = 1`, keyed by artist and by time to the second. In Cassandra, writing a row with an existing primary key overwrites it. If two people shared the same artist within the same second, the second write replaced the first, and the table recorded one share.

<figure class="fig">
<svg viewBox="0 0 680 160" role="img" aria-labelledby="t1t t1d">
  <title id="t1t">Two shares in the same second become one row</title>
  <desc id="t1d">Tweet A and tweet B both share artist X at 18:50:00. Both write the key (artist X, 18:50:00) with count 1. The second write overwrites the first, so Cassandra stores one row.</desc>
  <defs><marker id="t1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="16" width="200" height="46" rx="6"/>
  <text class="t" x="22" y="35">Tweet A</text><text class="m" x="22" y="52">18:50:00 · artist X</text>
  <rect class="box" x="10" y="96" width="200" height="46" rx="6"/>
  <text class="t" x="22" y="115">Tweet B</text><text class="m" x="22" y="132">18:50:00 · artist X</text>
  <rect class="box" x="270" y="52" width="170" height="54" rx="6"/>
  <text class="t" x="282" y="74">(artist X, 18:50:00)</text><text class="m" x="282" y="92">count = 1</text>
  <path class="ln" d="M210,39 L268,68" marker-end="url(#t1a)"/>
  <text class="m" x="236" y="44">write</text>
  <path class="sb" d="M210,119 L268,90" marker-end="url(#t1a)"/>
  <text class="tb" x="228" y="128">overwrites</text>
  <path class="ln" d="M440,79 L488,79" marker-end="url(#t1a)"/>
  <rect class="box" x="490" y="46" width="180" height="66" rx="6"/>
  <text class="t" x="502" y="68">Stored in Cassandra</text><text class="m" x="502" y="86">artist X · 18:50:00 · 1</text>
  <text class="tb" x="502" y="103">2 shares, 1 row</text>
</svg>
<figcaption>The primary key is (artist, second), so two shares of one artist in the same second land on the same row.</figcaption>
</figure>

So the undercount is largest at exactly the moment the chart exists to show: a new release, when many people share the same artist at once. The busier an artist was, the more their count was squashed. The ranking we displayed was a flattened version of the real one.

Any of these would have fixed it: a Cassandra `counter` column, the tweet id in the key, or counting per window in Spark and writing the aggregate. Each one also forces a decision the original design skipped, which is what exactly counts as one share.

## A window is a definition

The dashboard showed "the last 60 minutes", ending 30 seconds ago so a batch still in flight wouldn't count. It recomputed a `GROUP BY` over that window every five seconds, and did it twice, because two callbacks ran the same query.

<figure class="fig">
<svg viewBox="0 0 680 130" role="img" aria-labelledby="t2t t2d">
  <title id="t2t">The window behind the chart</title>
  <desc id="t2d">A time axis ending at now. The chart sums the 60 minutes ending 30 seconds before now. The last 30 seconds are excluded because Spark writes a batch every 30 seconds. Dash re-queries every 5 seconds.</desc>
  <line class="ln" x1="20" x2="660" y1="80" y2="80"/>
  <g tabindex="0"><title>Summed on the chart: the 60 minutes ending 30 s ago</title><rect class="fa" x="90" y="60" width="500" height="20" rx="4" opacity=".35"/></g>
  <text class="ta" x="340" y="52" text-anchor="middle">summed on the chart: 60 minutes</text>
  <rect class="fb" x="594" y="60" width="44" height="20" rx="4" opacity=".35"/>
  <text class="tb" x="616" y="52" text-anchor="middle">30 s</text>
  <line class="ln" x1="640" x2="640" y1="70" y2="92"/>
  <text class="t" x="640" y="108" text-anchor="middle">now</text>
  <text class="m" x="90" y="108" text-anchor="middle">now − 60 min − 30 s</text>
  <text class="m" x="600" y="124" text-anchor="end">last batch still in flight, excluded</text>
  <text class="m" x="20" y="16">Spark writes a batch every 30 s · Dash re-queries every 5 s · not to scale</text>
</svg>
<figcaption>Three numbers define "trending" on this chart: the 60-minute window, the 30-second batch, and the top-20 cut-off.</figcaption>
</figure>

Each of those numbers is a product decision:

- **60 minutes** favours sustained sharing. With 5 minutes, the chart would react to a single viral tweet.
- **Raw counts** favour artists who are already popular. Ranking by growth against each artist's own baseline would surface the ones actually rising, which is closer to what "trending" means.
- **The top 20** cuts off artists ranked 21st and below, however close they were.

We picked these because they looked good in a demo. That's a fine reason for a course project, as long as nobody forgets that the chart is those choices plus the data.

## What I'd build today

Kafka, Spark and Cassandra were a lot of infrastructure for a stream that fit on a laptop, but the course required them and they were the part I learned most from. Working on production data systems since then has mostly taught me where the effort should have gone instead. If I rebuilt it, I would spend the effort differently:

1. **Define a share first.** Unique tweet, all artists, retweets counted separately, and write it on the page.
2. **Count every drop.** Filtered by language, not a track, lookup failed, and show those counts next to the chart.
3. **Aggregate before storing.** Counts per window, keyed so writes can't collide.
4. **Rank by change, not volume.** Otherwise the chart only shows who is popular, not who is trending.
5. **Cache artist lookups.** The same few thousand tracks get shared repeatedly, and one API call per tweet is how you hit a rate limit.

A live dashboard reports on a measurement process. The infrastructure makes it fast, but the definitions decide whether what it shows is true.

The code and the report are on [GitHub](https://github.com/fadhilmch/streaming-twitter-spotify-trending-artists).
