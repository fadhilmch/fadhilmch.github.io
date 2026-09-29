---
layout: post
title: Building a streaming pipeline, then imagining it for real
date: 2021-04-17
tags:
- data
- systems
summary: A student Kafka, Spark and Cassandra pipeline for trending artists, what it taught me about streaming, and how I'd deploy it on a real cluster.
---

In autumn 2019, a classmate and I built a live chart of the artists people were sharing on Twitter. Tweets containing a Spotify link went into Kafka. Spark Streaming looked up each track's artist on the Spotify API, Cassandra stored the counts, and a Dash page redrew the top twenty every five seconds. It was my first streaming system.

It worked, and [the recording](https://youtu.be/eLnKT_aGahk) looks convincing: bars grow, artists move up and down. Reading the code again a year and a half later, I can see that we had built the *shape* of a streaming pipeline without most of the things that make one trustworthy. This post goes through what we built, the five things a stream has to get right, and how I'd deploy the same idea on a real cluster.

## What we built

<figure class="fig">
<svg viewBox="0 0 680 236" role="img" aria-labelledby="ga1 ga2">
  <title id="ga1">The pipeline as we built it</title>
  <desc id="ga2">Twitter stream API to a Tweepy producer to Kafka (one broker, one partition, replication 1) to Spark Streaming on one machine in 30-second batches. Spark calls the Spotify API once per tweet and writes to a single Cassandra node keyed by artist and second. Dash sums the last 60 minutes every 5 seconds.</desc>
  <defs><marker id="ta1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="22" y="42">Twitter stream API</text>
  <text class="m" x="22" y="60">keyword: spotify com</text>
  <text class="m" x="22" y="77">language: en</text>
  <rect class="box" x="180" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="192" y="42">Producer (Tweepy)</text>
  <text class="m" x="192" y="60">created_at +</text>
  <text class="m" x="192" y="77">first URL only</text>
  <rect class="box" x="350" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="362" y="42">Kafka</text>
  <text class="tb" x="362" y="60">single broker</text>
  <text class="tb" x="362" y="77">1 partition, RF 1</text>
  <rect class="box" x="520" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="42">Spark Streaming</text>
  <text class="m" x="532" y="60">30 s micro-batches</text>
  <text class="tb" x="532" y="77">one machine</text>
  <rect class="box" x="520" y="150" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="172">Spotify API</text>
  <text class="m" x="532" y="190">1 call per tweet</text>
  <text class="tb" x="532" y="207">errors dropped</text>
  <rect class="box" x="350" y="150" width="150" height="74" rx="6"/>
  <text class="t" x="362" y="172">Cassandra</text>
  <text class="m" x="362" y="190">key (artist, second)</text>
  <text class="tb" x="362" y="207">single node, RF 1</text>
  <rect class="box" x="180" y="150" width="150" height="74" rx="6"/>
  <text class="t" x="192" y="172">Dash</text>
  <text class="m" x="192" y="190">sum of last 60 min</text>
  <text class="m" x="192" y="207">re-query every 5 s</text>
  <path class="ln" d="M160,57 L178,57" marker-end="url(#ta1)"/>
  <path class="ln" d="M330,57 L348,57" marker-end="url(#ta1)"/>
  <path class="ln" d="M500,57 L518,57" marker-end="url(#ta1)"/>
  <path class="ln" d="M620,94 L620,148" marker-end="url(#ta1)" marker-start="url(#ta1)"/>
  <path class="ln" d="M560,94 L560,122 L425,122 L425,148" marker-end="url(#ta1)"/>
  <path class="ln" d="M350,187 L332,187" marker-end="url(#ta1)"/>
  <circle class="fb" cx="18" cy="170" r="5"/><text class="m" x="30" y="174">single point of</text><text class="m" x="30" y="190">failure or silent loss</text>
</svg>
<figcaption>As built. Every component ran as a single copy on one laptop; the orange labels are where data could be lost without anyone noticing.</figcaption>
</figure>

Each stage had one job:

- **The producer** listened to Twitter's filtered stream for tweets containing "spotify com", kept only the timestamp and the first link, and published a small JSON event to Kafka.
- **Kafka** buffered those events, so a slow consumer didn't lose tweets while it caught up.
- **Spark Streaming** read from Kafka in 30-second micro-batches, pulled the track id out of each link, asked the Spotify API for the artist, and wrote one row per tweet to Cassandra.
- **Cassandra** stored the rows, and **Dash** re-ran a `SUM ... GROUP BY artist` over the last hour every five seconds to draw the chart.

On paper that's the textbook architecture: a durable log, a stream processor, a store and a view. In practice every component was a single copy. Kafka had one broker, one partition and replication factor (RF) 1; Spark ran as `local[*]` on one machine; Cassandra was a single node with replication factor 1. That's fine for a demo. It also means none of the properties we chose these tools for were actually switched on.

## Five things a stream has to get right

### 1. Know where you resume after a restart

A batch job that crashes can simply run again. A stream that crashes has to know where it stopped. Our Spark job read Kafka directly but never saved its offsets, so after a restart it started from the latest message. Anything that arrived while it was down was silently skipped. Kafka still held those tweets; we had just lost track of where we were in them.

The fix is to checkpoint offsets together with the processing state, and restart from the checkpoint rather than from "now".

### 2. Make writes idempotent

The Cassandra table looked like this:

```sql
CREATE TABLE artistshare (
  created_at timestamp, artist text, count int,
  PRIMARY KEY (artist, created_at)
);
```

Each tweet was written as a row with `count = 1`, keyed by artist and by time to the second. In Cassandra, writing a row with an existing primary key overwrites it. If two people shared the same artist within the same second, the second write replaced the first.

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

So the undercount was largest at exactly the moment the chart exists to show: a new release, when many people share the same artist at once. The ranking we displayed was a flattened version of the real one.

The general lesson is that a streaming sink must produce the same result no matter how many times a record arrives or how records collide. Streams deliver *at least once* after any failure, so writes need to be idempotent. Here that means aggregating in the stream and writing one count per `(window, artist)`, which is safe to overwrite, or keying raw rows by tweet id.

### 3. Count by event time, not arrival time

We did store each tweet's own timestamp, which was the right call. But the window was computed by the dashboard, from the dashboard's clock:

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
<figcaption>The dashboard's window was anchored to its own clock. A tweet that arrived late, after its minute had already scrolled out, was never counted.</figcaption>
</figure>

Tweets don't arrive in order. A slow producer, a Kafka backlog or a Spark restart can deliver a tweet minutes late, and by then its minute may already have scrolled out of the window. A stream processor can handle this properly. It groups by the event's own time, and a *watermark* says how long to wait for late events before closing a window. That turns "the last 60 minutes" into a definition the pipeline enforces, instead of whatever happened to arrive by the time the dashboard asked.

### 4. Keep slow calls off the hot path

For every tweet, Spark made a blocking HTTP call to the Spotify API. That puts an external service's latency and rate limits directly on the stream. If Spotify slowed down, the whole batch slowed down; if a call failed, the code returned `None` and the record was filtered out without being counted.

The same few thousand tracks get shared again and again, so a cache in front of the API would absorb most lookups. The remaining calls can run asynchronously with a rate limiter. Failures shouldn't vanish: they belong on a *dead-letter topic*, where they can be counted, inspected and replayed once the cause is fixed.

### 5. Decide what one event is

Every filter in a stream quietly decides what counts:

- **Language:** only English tweets, as detected by Twitter.
- **First link, first artist:** a tweet sharing two tracks counted once, and a collaboration counted only for whoever Spotify listed first.
- **Tracks only:** albums and playlists were dropped.
- **No tweet id:** a retweet was indistinguishable from an original share, and there was no way to remove duplicates.

None of these is wrong on its own, but each changes the chart, and none was visible on the page. In a stream, the definition of an event is the schema of everything downstream. It deserves a written decision, and each filter deserves a counter.

## How I'd deploy it for real

Nothing about this product needs a big cluster; the stream fit comfortably on a laptop. But if it had to run continuously and survive failures, the shape changes like this:

<figure class="fig">
<svg viewBox="0 0 680 426" role="img" aria-labelledby="gb1 gb2">
  <title id="gb1">How I would deploy it on a real cluster</title>
  <desc id="gb2">Two ingest services keep tweet ids and write to a three-broker Kafka cluster with six partitions and replication 3. A stream processor with several workers deduplicates, extracts every track and artist, enriches through a cache before calling Spotify, windows by event time with a watermark, and counts per window and artist. Failed lookups go to a dead-letter topic. State and offsets are checkpointed to object storage, and metrics track lag and drops. Counts go to a three-node Cassandra cluster keyed by window and artist, behind a query API that pushes updates to the dashboard.</desc>
  <defs><marker id="tb1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="22" y="42">Twitter stream</text>
  <text class="m" x="22" y="60">filtered stream API</text>
  <text class="m" x="22" y="77"></text>
  <rect class="box" x="180" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="192" y="42">Ingest service ×2</text>
  <text class="m" x="192" y="60">keeps the tweet id</text>
  <text class="m" x="192" y="77">reconnect, backoff</text>
  <rect class="box" x="350" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="362" y="42">Kafka ×3 brokers</text>
  <text class="ta" x="362" y="60">6 partitions</text>
  <text class="ta" x="362" y="77">RF 3</text>
  <rect class="box" x="520" y="20" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="42">Dead-letter topic</text>
  <text class="m" x="532" y="60">failed lookups</text>
  <text class="m" x="532" y="77">replay after a fix</text>
  <rect class="box" x="180" y="130" width="320" height="172" rx="6"/>
  <text class="t" x="192" y="152">Stream processor · N workers</text>
  <text class="m" x="192" y="170">Flink or Spark Structured Streaming</text>
  <text class="ta" x="192" y="198">1  drop duplicate tweet ids</text>
  <text class="ta" x="192" y="218">2  extract every track, every artist</text>
  <text class="ta" x="192" y="238">3  enrich: cache first, then Spotify</text>
  <text class="ta" x="192" y="258">4  window by event time + watermark</text>
  <text class="ta" x="192" y="278">5  count per (window, artist)</text>
  <rect class="box" x="10" y="130" width="150" height="58" rx="6"/>
  <text class="t" x="22" y="152">Artist cache</text>
  <text class="m" x="22" y="170">track → artists</text>
  <rect class="box" x="10" y="244" width="150" height="58" rx="6"/>
  <text class="t" x="22" y="266">Spotify API</text>
  <text class="m" x="22" y="284">rate-limited, async</text>
  <rect class="box" x="520" y="130" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="152">Checkpoints</text>
  <text class="m" x="532" y="170">state + offsets</text>
  <text class="m" x="532" y="187">object storage</text>
  <rect class="box" x="520" y="228" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="250">Metrics</text>
  <text class="m" x="532" y="268">consumer lag</text>
  <text class="m" x="532" y="285">drops by reason</text>
  <rect class="box" x="180" y="340" width="150" height="74" rx="6"/>
  <text class="t" x="192" y="362">Cassandra ×3</text>
  <text class="ta" x="192" y="380">RF 3</text>
  <text class="m" x="192" y="397">key (window, artist)</text>
  <rect class="box" x="350" y="340" width="150" height="74" rx="6"/>
  <text class="t" x="362" y="362">Query API</text>
  <text class="m" x="362" y="380">cached top 20</text>
  <text class="m" x="362" y="397"></text>
  <rect class="box" x="520" y="340" width="150" height="74" rx="6"/>
  <text class="t" x="532" y="362">Dashboard</text>
  <text class="m" x="532" y="380">pushed updates</text>
  <text class="m" x="532" y="397"></text>
  <path class="ln" d="M160,57 L178,57" marker-end="url(#tb1)"/>
  <path class="ln" d="M330,57 L348,57" marker-end="url(#tb1)"/>
  <path class="ln" d="M425,94 L425,128" marker-end="url(#tb1)"/>
  <path class="ln dash" d="M480,130 L560,96" marker-end="url(#tb1)"/>
  <path class="ln" d="M180,159 L162,159" marker-end="url(#tb1)" marker-start="url(#tb1)"/>
  <path class="ln dash" d="M85,188 L85,242" marker-end="url(#tb1)"/>
  <text class="m" x="93" y="220">on a miss</text>
  <path class="ln" d="M500,167 L518,167" marker-end="url(#tb1)"/>
  <path class="ln dash" d="M500,265 L518,265" marker-end="url(#tb1)"/>
  <path class="ln" d="M255,302 L255,338" marker-end="url(#tb1)"/>
  <path class="ln" d="M330,377 L348,377" marker-end="url(#tb1)"/>
  <path class="ln" d="M500,377 L518,377" marker-end="url(#tb1)"/>
</svg>
<figcaption>The same product on a real cluster. Every stateful piece is replicated, every drop is counted, and a restart resumes from a checkpoint instead of from "now". Blue marks what changed.</figcaption>
</figure>

- **Ingest:** two small, stateless services hold the Twitter connection, reconnect with backoff, and keep the tweet id. The id is what makes deduplication and idempotent writes possible later.
- **Kafka:** three brokers with replication factor 3, so losing a machine loses no data. Six partitions let several stream workers read in parallel.
- **Stream processor:** Flink or Spark Structured Streaming, running several workers. This is where the five fixes live: deduplicate by tweet id, extract every track and every artist, enrich through the cache, window by event time with a watermark, and count per window and artist.
- **Checkpoints:** processing state and Kafka offsets are saved together to object storage, so a restart resumes exactly where it stopped.
- **Dead-letter topic:** failed lookups are kept, counted and replayable instead of dropped.
- **Cassandra:** three nodes with replication factor 3, storing one row per `(window, artist)`. Rewriting a count is harmless, so replays can't corrupt it.
- **Serving:** a small query API caches the current top 20 and pushes updates to the dashboard, instead of every open browser running its own `GROUP BY` every five seconds.
- **Metrics:** consumer lag says whether the stream is keeping up; drop counters by reason say how much of the stream the chart actually represents.

The biggest differences from what we built aren't the extra machines. They're the things that make results repeatable: saved offsets, idempotent writes, event time and counted drops. Those would have been worth doing even on one laptop.

The code and the report are on [GitHub](https://github.com/fadhilmch/streaming-twitter-spotify-trending-artists).
