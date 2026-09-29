---
layout: post
title: Paying to ask "anything new?"
tags:
- exp
- mlops
- systems
summary: Most of our experimentation platform's cloud bill came from polling for config that almost never changed.
---

<!--
DRAFT NOTES (delete before publishing)
Facts from resume-source.md + interview on 2026-09-29:
- Traveloka experimentation platform, GCP. Cost -95% YoY (2023 vs 2024 actual billing, shared-service
  allocation estimated). Drivers: removing polling (architecture change) and right-sizing. The Go service
  cut latency, not cost. Latency -90% = Go concurrency + cache. Earlier separate phase: -50% resource use.
- 20+ backend services (each with multiple pods on GKE) plus every Traveloka user through the apps.
- About 10 config changes a day across all experiments company-wide, including bandits that shift
  their split every few hours. Polling interval: 2 minutes (720 polls per pod per day).
- Redis was added because of the multi-pod deployment.
- No real stale-config incident; the risk is framed as a what-if.
- Stampede: never handled and never a problem at our pod count; framed that way.
- Figures are inline SVG styled by assets/css/posts.css (.fig). Figure 2 is illustrative, not measured.
Planned follow-ups:
- Article 2: design deep dive on alternatives (push/streaming, versioned snapshots, conditional fetch, etc.).
- Article 4: online bandits in production (traffic re-split every few hours; builds on the stub
  _posts/2026-04-11-thompson-sampling-explained-with-coupons.md).
- Article 3: Go concurrency, semaphores and worker pools, through an embedded-systems lens.
  Could replace the stub _posts/2025-12-06-go-worker-pools-for-experiment-assignment.md.
-->

When I led the modernisation of Traveloka's experimentation platform, the platform ran more than 800 experiments a year for over 30 product teams. From 2023 to 2024 its cloud bill fell by 95% and API latency by 90%. Several changes contributed, but most of the saving came from one realisation: we were paying to ask a question whose answer was almost always "no".

## The question

An experimentation platform has two very different kinds of traffic.

**Config changes** happen when someone creates an experiment, changes a traffic split, pauses a test, or when a bandit shifts traffic toward the variant that's winning. Our bandits re-split traffic every few hours on their own. Across the whole company, all running experiments together changed config around ten times a day.

**Config reads** happen every time anything needs to assign a user to a variant. For us that meant more than 20 backend services, each running many pods on GKE, plus every Traveloka user through the apps.

Our backend services kept their config fresh by polling Firestore every two minutes. That's 720 polls a day from every pod, to catch about ten changes spread across the whole company. Each poll asked the same question: has anything changed? Firestore bills per document read, so the cost was roughly:

```text
pods × documents per poll × polls per day
```

The rate of change doesn't appear in that formula. The bill grew with fleet size and the number of hours in a day, not with how often anything changed. Adding a service, adding experiments, or scaling out for a traffic peak all made it bigger, while the answer stayed "no" nearly every time.

<figure class="fig">
<svg viewBox="0 0 680 250" role="img" aria-labelledby="f2t f2d">
  <title id="f2t">Firestore reads over a day, polling versus events</title>
  <desc id="f2d">Illustrative. Polling reads rise in a straight line through the day. Event-driven reads stay low and step up slightly at each config change.</desc>
  <line class="sb" x1="60" x2="80" y1="14" y2="14"/><text class="t" x="86" y="18">Polling</text>
  <line class="sa" x1="160" x2="180" y1="14" y2="14"/><text class="t" x="186" y="18">Events + cache + TTL</text>
  <line class="grid" x1="60" x2="640" y1="210" y2="210"/>
  <line class="grid" x1="60" x2="60" y1="40" y2="210"/>
  <text class="m" transform="translate(44 210) rotate(-90)">Firestore reads, cumulative</text>
  <text class="m" x="60" y="228" text-anchor="middle">00:00</text>
  <text class="m" x="205" y="228" text-anchor="middle">06:00</text>
  <text class="m" x="350" y="228" text-anchor="middle">12:00</text>
  <text class="m" x="495" y="228" text-anchor="middle">18:00</text>
  <text class="m" x="640" y="228" text-anchor="middle">24:00</text>
  <g tabindex="0"><title>Polling: reads grow with pods × time, whether or not anything changed</title>
    <path class="sb" d="M60,210 L640,50"/>
    <path d="M60,210 L640,50" style="stroke:transparent;stroke-width:14;fill:none"/>
  </g>
  <g tabindex="0"><title>Events + cache + TTL: a step per config change, plus a slow slope from TTL reloads</title>
    <path class="sa" d="M60,210 L84.2,209.6 L84.2,206.6 L132.5,205.8 L132.5,202.8 L180.8,201.9 L180.8,198.9 L253.3,197.7 L253.3,194.7 L277.5,194.2 L277.5,191.2 L325.8,190.4 L325.8,187.4 L398.3,186.2 L398.3,183.2 L422.5,182.8 L422.5,179.8 L470.8,178.9 L470.8,175.9 L543.3,174.7 L543.3,171.7 L640,170.0"/>
    <path d="M60,210 L84.2,209.6 L84.2,206.6 L132.5,205.8 L132.5,202.8 L180.8,201.9 L180.8,198.9 L253.3,197.7 L253.3,194.7 L277.5,194.2 L277.5,191.2 L325.8,190.4 L325.8,187.4 L398.3,186.2 L398.3,183.2 L422.5,182.8 L422.5,179.8 L470.8,178.9 L470.8,175.9 L543.3,174.7 L543.3,171.7 L640,170.0" style="stroke:transparent;stroke-width:14;fill:none"/>
  </g>
  <text class="tb" x="630" y="42" text-anchor="end">grows with pods × time</text>
  <text class="ta" x="630" y="162" text-anchor="end">grows with changes</text>
</svg>
<figcaption>The shape of the problem (illustrative, not measured). Polling pays every pod, every interval. Events pay once per change; the slow slope is TTL reloads.</figcaption>
</figure>

## The other client had the opposite problem

The frontend did assignment in the client. The app fetched experiment config and computed each user's variant on the device.

That was cheap, but config only refreshed when the app restarted, and a backgrounded mobile app might not restart for days or weeks. So when a team paused a broken experiment, users who hadn't restarted kept seeing the broken variant, and nobody could stop it centrally.

So the two clients failed in opposite ways. The backend paid to stay fresh when it didn't need to. The frontend stayed stale when it mattered most.

## What we changed

The fix was to stop asking and start being told.

1. **A local cache in each pod.** Config is read from memory on the request path. That alone removed most Firestore reads and most of the per-request latency.
2. **A change event on every config update.** Editing an experiment publishes an event, and pods invalidate their cache when they receive it. Reads now scale with the number of changes, not the number of seconds.
3. **A TTL as a backstop.** If an event is lost or delayed, the entry expires and gets reloaded anyway. The TTL is the promise to users: config is never staler than this.
4. **Redis as a shared layer.** We ran many pods, and each pod's local cache was its own copy. Two pods could disagree for a while, and every pod reloaded from Firestore separately. Putting Redis between the pods and Firestore gave them one shared copy and turned many reloads into one.

<figure class="fig">
<svg viewBox="0 0 680 310" role="img" aria-labelledby="f1t f1d">
  <title id="f1t">Config flow before and after</title>
  <desc id="f1d">Before: backend services poll Firestore on a schedule and apps fetch config only at start. After: an edit publishes an event to the assignment service, whose pods cache locally and share Redis, reading Firestore only on a miss.</desc>
  <defs><marker id="f1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="16">BEFORE</text>
  <rect class="box" x="10" y="28" width="190" height="46" rx="6"/>
  <text class="t" x="22" y="47">Backend services</text><text class="m" x="22" y="64">20+ services, many pods</text>
  <rect class="box" x="10" y="88" width="190" height="46" rx="6"/>
  <text class="t" x="22" y="107">Mobile and web apps</text><text class="m" x="22" y="124">assign on the device</text>
  <rect class="box" x="470" y="50" width="200" height="60" rx="6"/>
  <text class="t" x="482" y="74">Firestore</text><text class="m" x="482" y="92">billed per document read</text>
  <path class="sb" d="M200,51 C320,51 350,70 468,74" marker-end="url(#f1a)"/>
  <text class="tb" x="335" y="48" text-anchor="middle">polls on a schedule, all day</text>
  <path class="ln dash" d="M200,111 C320,111 350,95 468,90" marker-end="url(#f1a)"/>
  <text class="m" x="335" y="126" text-anchor="middle">fetches once, at app start</text>
  <line class="grid" x1="10" x2="670" y1="152" y2="152"/>
  <text class="h" x="10" y="176">AFTER</text>
  <rect class="box" x="10" y="188" width="190" height="46" rx="6"/>
  <text class="t" x="22" y="207">Experiment edited</text><text class="m" x="22" y="224">~10 changes a day</text>
  <rect class="box" x="10" y="250" width="190" height="46" rx="6"/>
  <text class="t" x="22" y="269">Services and apps</text><text class="m" x="22" y="286">ask the service to assign</text>
  <rect class="box" x="270" y="206" width="180" height="72" rx="6"/>
  <text class="t" x="282" y="228">Assignment service</text><text class="m" x="282" y="246">local cache per pod</text><text class="m" x="282" y="263">TTL as a backstop</text>
  <rect class="box" x="500" y="188" width="170" height="46" rx="6"/>
  <text class="t" x="512" y="207">Redis</text><text class="m" x="512" y="224">shared across pods</text>
  <rect class="box" x="500" y="250" width="170" height="46" rx="6"/>
  <text class="t" x="512" y="269">Firestore</text><text class="m" x="512" y="286">read on a miss only</text>
  <path class="sa" d="M200,211 L268,226" marker-end="url(#f1a)"/>
  <text class="ta" x="236" y="208" text-anchor="middle">event</text>
  <path class="ln" d="M200,273 L268,262" marker-end="url(#f1a)"/>
  <path class="ln" d="M450,230 L498,213" marker-end="url(#f1a)"/>
  <path class="ln dash" d="M450,258 L498,272" marker-end="url(#f1a)"/>
</svg>
<figcaption>Before, the cost path ran from every pod to Firestore all day. After, Firestore is only read when a change or a TTL expiry actually needs it.</figcaption>
</figure>

Near the time I left, we also moved frontend assignment to the server. That wasn't about cost; the backend was already cheap by then. It was about control. Once assignment happened in a service we ran, pausing an experiment took effect for everyone within the event-and-TTL window, rather than whenever each user next restarted the app.

## Freshness is the real requirement

Caching trades cost for correctness, so the question becomes how stale you're allowed to be.

**Stale config.** We never had a serious incident from it, but the what-if drove the design. Suppose a team ships a broken experiment: a variant that fails at checkout, say. They pause it. If the pause doesn't reach the serving path, users keep landing in the broken variant, and every minute of that is lost bookings. Under client-side assignment, "a while" meant until each user restarted the app. With events, it means seconds. If an event is lost, it means one TTL at most. That's why the TTL has to come from the worst staleness you can accept for a kill switch, not from how many reads it saves.

<figure class="fig">
<svg viewBox="0 0 680 185" role="img" aria-labelledby="f3t f3d">
  <title id="f3t">How long a paused experiment keeps serving</title>
  <desc id="f3d">Log time scale. With an event: seconds. If the event is lost: up to the TTL. With assignment on the device: until the app restarts, days or weeks.</desc>
  <line class="grid" x1="230" x2="230" y1="30" y2="160"/><line class="grid" x1="358" x2="358" y1="30" y2="160"/>
  <line class="grid" x1="486" x2="486" y1="30" y2="160"/><line class="grid" x1="585" x2="585" y1="30" y2="160"/>
  <line class="grid" x1="646" x2="646" y1="30" y2="160"/>
  <text class="m" x="230" y="176" text-anchor="middle">1 s</text><text class="m" x="358" y="176" text-anchor="middle">1 min</text>
  <text class="m" x="486" y="176" text-anchor="middle">1 h</text><text class="m" x="585" y="176" text-anchor="middle">1 day</text>
  <text class="m" x="646" y="176" text-anchor="middle">1 week</text>
  <text class="t" x="10" y="51">Event reaches the pod</text>
  <text class="t" x="10" y="96">Event lost, TTL expires</text>
  <text class="t" x="10" y="141">Assigned on the device</text>
  <g tabindex="0"><title>Event reaches the pod: seconds</title><rect class="fa" x="210" y="40" width="42" height="14" rx="4"/></g>
  <text class="m" x="260" y="51">seconds</text>
  <g tabindex="0"><title>Event lost: stale until the TTL expires</title><rect class="fa" x="210" y="85" width="190" height="14" rx="4"/></g>
  <text class="m" x="408" y="96">up to the TTL</text>
  <g tabindex="0"><title>Client-side assignment: stale until the app restarts, days or weeks</title><rect class="fb" x="210" y="130" width="436" height="14" rx="4"/></g>
  <text class="m" x="646" y="124" text-anchor="end">until the app restarts</text>
</svg>
<figcaption>How long a paused experiment keeps serving, on a log scale. The TTL is drawn as minutes for illustration.</figcaption>
</figure>

**The stampede that didn't happen.** When many pods cache the same entries with the same TTL, they expire together. Everything misses at once and reloads at once, briefly recreating the load the cache was supposed to remove. We never did anything about it, because at our pod count the burst was small and Redis absorbed it. With a much larger fleet I would randomise TTLs slightly so expiries spread out, and let one caller reload a key while the rest wait for its result.

## Where the numbers came from

To be precise about the claims:

- **Cost −95%** compares actual 2023 and 2024 cloud billing for the platform. Some shared services had to be allocated by estimate. Two things drove it: removing the polling, which was an architecture change, and right-sizing the workloads once they no longer had to absorb that load.
- **Latency −90%** came from serving config from cache instead of a Firestore round trip, and from a Go service that handled requests concurrently. The Go service was about speed, not cost.
- **An earlier −50% in resource use** came from an earlier phase of making the API asynchronous. It's a separate result and I don't count it in the 95%.

## What I took from it

If a system reads something far more often than it changes, check whether you're paying for the reads. Polling is the easiest design to build and the hardest to notice, because each poll is tiny and the total cost only appears on the bill.

The version I'd defend now:

- make reads free (cache them) and make changes loud (send an event);
- keep a TTL, but choose it from the worst staleness you can accept, not from cost;
- put assignment somewhere you control, because a kill switch that only works after an app restart isn't a kill switch.

Local cache plus Redis plus TTL isn't the only design. Push-based config streams, versioned snapshots and conditional fetches each trade cost, freshness and complexity differently. That's the next post.
