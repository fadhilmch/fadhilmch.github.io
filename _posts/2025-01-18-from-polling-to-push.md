---
layout: post
title: "From polling to push: getting experiment config to every service"
date: 2025-01-18
tags:
- exp
- systems
summary: The architecture we had, the one we moved to, and the designs I'd weigh today, for the unglamorous job of keeping experiment config fresh everywhere.
---

An experimentation platform looks like it's about statistics. A lot of the engineering is about something plainer: making sure that when someone changes an experiment, every service that assigns users to variants finds out, quickly and cheaply.

I led the modernisation of a platform that ran hundreds of experiments a year for dozens of product teams. This post is about one part of that work, the path config takes from where people edit it to where it's used. We went from polling to event-driven caching, cut the platform's cloud bill by 95% and API latency by 90% over a year, and ended up with a much clearer design. I'll finish with the alternatives I'd consider if I were building it again.

## Two sides with very different traffic

It helps to split the platform in two. The **control plane** is where experiments change: people create them, change traffic splits, pause them, and bandits shift traffic toward the winning variant every few hours. Across all running experiments, that was around ten changes a day. The **data plane** is where config is used: every request that needs to know which variant a user sees. That was more than 20 backend services, each running many pods on Kubernetes, plus every user of the apps.

<figure class="fig">
<svg viewBox="0 0 680 186" role="img" aria-labelledby="x0t x0d">
  <title id="x0t">Control plane and data plane of an experimentation platform</title>
  <desc id="x0d">People and a bandit updater write experiment config to a config store about ten times a day. Services and apps ask an assignment component for a variant on every request. The open question is how config gets from the store to assignment.</desc>
  <defs><marker id="xa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="16">CONTROL PLANE · RARE WRITES</text>
  <text class="h" x="670" y="16" text-anchor="end">DATA PLANE · CONSTANT READS</text>
  <rect class="box" x="10" y="30" width="190" height="54" rx="6"/>
  <text class="t" x="22" y="51">Experiment UI / API</text>
  <text class="m" x="22" y="68">create, split, pause, ramp</text>
  <rect class="box" x="10" y="100" width="190" height="54" rx="6"/>
  <text class="t" x="22" y="121">Bandit updater</text>
  <text class="m" x="22" y="138">re-splits every few hours</text>
  <rect class="box" x="250" y="62" width="170" height="60" rx="6"/>
  <text class="t" x="262" y="83">Config store</text>
  <text class="m" x="262" y="100">Firestore</text>
  <rect class="box" x="480" y="30" width="190" height="54" rx="6"/>
  <text class="t" x="492" y="51">Assignment</text>
  <text class="m" x="492" y="68">picks a variant per user</text>
  <rect class="box" x="480" y="100" width="190" height="54" rx="6"/>
  <text class="t" x="492" y="121">Services and apps</text>
  <text class="m" x="492" y="138">ask on every request</text>
  <path class="ln" d="M200,57 L248,82" marker-end="url(#xa)"/>
  <path class="ln" d="M200,127 L248,104" marker-end="url(#xa)"/>
  <path class="sb dash" d="M420,92 L478,62" marker-end="url(#xa)"/>
  <text class="tb" x="452" y="116" text-anchor="middle">?</text>
  <path class="ln" d="M575,100 L575,86" marker-end="url(#xa)"/>
  <text class="m" x="105" y="176" text-anchor="middle">~10 changes a day</text>
  <text class="m" x="575" y="176" text-anchor="middle">every request, all day</text>
</svg>
<figcaption>Two sides with very different traffic. This post is about the dashed arrow: how config travels from the store to wherever assignment happens.</figcaption>
</figure>

A good design for the arrow in the middle has to meet five requirements at once:

- **Fresh:** a paused experiment stops serving quickly. That's the kill switch.
- **Consistent:** the same user gets the same variant from every service.
- **Cheap:** cost should grow with changes, not with traffic or time.
- **Fast:** assignment sits on the request path, so it can't add much latency.
- **Resilient:** if the config store has a bad minute, assignment keeps working with the last known config.

## Where we started

The first architecture had two clients, and each failed one requirement badly.

**The backend polled.** Every pod asked Firestore for the current config every two minutes. That's 720 polls a day from every pod, to catch about ten changes spread across the whole company. Firestore bills per document read, so the cost was roughly:

```text
pods × documents per poll × polls per day
```

The rate of change doesn't appear in that formula. The bill grew with fleet size and the number of hours in a day. Adding a service, adding experiments, or scaling out for a traffic peak all made it bigger, while the answer stayed "no change" nearly every time.

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

**The apps assigned on the device.** The app fetched config at start-up and computed each user's variant locally. That was cheap, but config only refreshed when the app restarted, and a backgrounded mobile app might not restart for days or weeks. When a team paused a broken experiment, users who hadn't restarted kept seeing it. It also meant the assignment logic existed twice, in the backend and in the apps, and the two had to stay identical.

So the backend paid to stay fresh when it didn't need to, and the apps stayed stale when it mattered most.

## Where we ended up

The redesign moved assignment into one service and changed how that service learns about changes.

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

1. **One assignment service.** Backend services and, eventually, the apps ask the service for variants instead of computing them. One implementation, one place to fix bugs, and a kill switch that works for everyone.
2. **A local cache in each pod.** Config is read from memory on the request path. That alone removed most Firestore reads and most of the per-request latency.
3. **A change event on every config update.** Saving an experiment, or a bandit re-split, publishes an event, and pods invalidate their cache when they receive it. Reads now scale with the number of changes, not the number of seconds.
4. **A TTL as a backstop.** If an event is lost or delayed, the entry expires and gets reloaded anyway.
5. **Redis as a shared layer.** Because the service ran as many pods, each local cache was its own copy. Two pods could disagree for a while, and every pod reloaded from Firestore separately. Redis between the pods and Firestore gave them one shared copy and turned many reloads into one.

Here's what happens when someone pauses an experiment:

```mermaid
sequenceDiagram
  participant UI as Experiment UI
  participant FS as Firestore
  participant EV as Change event
  participant P as Assignment pods
  participant R as Redis
  UI->>FS: pause experiment 42
  UI->>EV: publish "42 changed"
  EV->>P: invalidate 42
  Note over P: next request for 42
  P->>R: get config 42
  R-->>P: miss
  P->>FS: read config 42
  P->>R: store config 42 with TTL
```

The service itself was rewritten in Go, handling requests concurrently with worker pools. Together with serving config from memory instead of a Firestore round trip, that's where the 90% latency drop came from.

### Freshness is the real requirement

Caching trades cost for correctness, so the key question is how stale config is allowed to be. We never had a serious incident from it, but the what-if drove the design. Suppose a team ships a broken experiment, say a variant that fails at checkout, and pauses it. If the pause doesn't reach the serving path, users keep landing in the broken variant, and every minute of that is lost sales.

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

With client-side assignment, "a while" meant until each user restarted the app. With events, it means seconds; if an event is lost, one TTL at most. So the TTL should come from the worst staleness you can accept for a kill switch, not from how many reads it saves.

### What it changed

- **Cloud cost fell 95% year over year**, measured on actual billing with some shared services allocated by estimate. Two things drove it: removing the polling, and right-sizing the workloads once they no longer had to absorb that load.
- **API latency fell 90%**, from in-memory config plus the concurrent Go service.
- An **earlier phase** of making the API asynchronous had already cut resource use by 50%; I count that separately.
- The less measurable win was **control**: one assignment path, and a kill switch that reaches every user within seconds.

## What I'd consider now

The design above works, but it has more moving parts than the problem needs: an event channel, Redis, a TTL and a fallback read path, all to keep a small, rarely changing dataset fresh. These are the alternatives I'd weigh today, starting with the smallest change.

### 1. Let Firestore push the changes

Firestore can already push changes itself. A **snapshot listener** subscribes to a query and receives an update whenever a matching document changes. Each assignment pod could listen to the config collection and keep the result in memory.

<figure class="fig">
<svg viewBox="0 0 680 150" role="img" aria-labelledby="x1t x1d">
  <title id="x1t">Firestore snapshot listeners</title>
  <desc id="x1d">Each assignment pod opens a snapshot listener on the Firestore config collection. Firestore pushes changed documents to every pod, which keeps config in memory.</desc>
  <defs><marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="40" width="170" height="60" rx="6"/>
  <text class="t" x="22" y="61">Firestore</text>
  <text class="m" x="22" y="78">config collection</text>
  <text class="m" x="10" y="124">sends only changed</text><text class="m" x="10" y="140">documents</text>
  <rect class="box" x="430" y="14" width="240" height="38" rx="6"/>
  <text class="t" x="442" y="38">Pod 1</text>
  <text class="m" x="510" y="38">config held in memory</text>
  <path class="sa" d="M180,70 C300,70 320,33 428,33" marker-end="url(#a1)"/>
  <rect class="box" x="430" y="58" width="240" height="38" rx="6"/>
  <text class="t" x="442" y="82">Pod 2</text>
  <text class="m" x="510" y="82">config held in memory</text>
  <path class="sa" d="M180,70 C300,70 320,77 428,77" marker-end="url(#a1)"/>
  <rect class="box" x="430" y="102" width="240" height="38" rx="6"/>
  <text class="t" x="442" y="126">Pod 3</text>
  <text class="m" x="510" y="126">config held in memory</text>
  <path class="sa" d="M180,70 C300,70 320,121 428,121" marker-end="url(#a1)"/>
  <text class="ta" x="250" y="118" text-anchor="middle">snapshot listeners</text>
</svg>
<figcaption>Each pod subscribes to the config collection. Firestore sends the full set once on connect, then only the documents that change.</figcaption>
</figure>

This replaces the change event, the TTL, and arguably Redis: the source of truth notifies the pods directly, so there's no separate channel to fall out of sync. The costs are different rather than zero. Each listener pays for reading the full result set when it connects and for each changed document after that. A listener that stays disconnected too long is billed as a new query when it reconnects. And every pod holds an open connection to the database. At ten changes a day and tens of pods, that's cheap. I'd still keep a slow periodic resync, in case a listener silently stops.

### 2. Poll cheaply with ETags

Polling itself isn't the problem; paying for a full read on every poll is. HTTP already has the fix. Serve the whole config from one URL, from a storage bucket or a small service, with an **ETag**: a short fingerprint of the content, usually a hash of it. The client keeps the ETag it last received and sends it back on its next poll in an `If-None-Match` header. If the config hasn't changed, the server replies `304 Not Modified` with no body. If it has, it sends the new config with its new ETag.

<figure class="fig">
<svg viewBox="0 0 680 190" role="img" aria-labelledby="x2t x2d">
  <title id="x2t">Polling with ETags</title>
  <desc id="x2d">A publisher writes config.json on every change; the server labels it with an ETag, a hash of its contents. Pods and apps poll with If-None-Match and the last ETag they saw. Usually the answer is 304 Not Modified with no body; after a change it is 200 with the new config and a new ETag.</desc>
  <defs><marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="20" width="150" height="54" rx="6"/><text class="t" x="22" y="41">Publisher</text><text class="m" x="22" y="58">on every change</text>
  <rect class="box" x="210" y="20" width="180" height="54" rx="6"/><text class="t" x="222" y="41">config.json</text><text class="m" x="222" y="58">ETag = hash(contents)</text>
  <rect class="box" x="490" y="20" width="180" height="54" rx="6"/><text class="t" x="502" y="41">Pods and apps</text><text class="m" x="502" y="58">remember the last ETag</text>
  <path class="ln" d="M160,47 L208,47" marker-end="url(#a2)"/>
  <line class="grid dash" x1="300" x2="300" y1="74" y2="176"/><line class="grid dash" x1="580" x2="580" y1="74" y2="176"/>
  <path class="ln" d="M578,104 L302,104" marker-end="url(#a2)"/>
  <text class="m" x="440" y="97" text-anchor="middle">GET config · If-None-Match: "9f2c"</text>
  <g tabindex="0"><title>Usual case: nothing changed, empty reply</title><path class="ln dash" d="M302,134 L578,134" marker-end="url(#a2)"/></g>
  <text class="m" x="440" y="127" text-anchor="middle">304 Not Modified · no body</text>
  <g tabindex="0"><title>After a change: new body and new ETag</title><path class="sa" d="M302,164 L578,164" marker-end="url(#a2)"/></g>
  <text class="ta" x="440" y="157" text-anchor="middle">after a change: 200 · new config · ETag "a71e"</text>
  <text class="m" x="10" y="120">most polls:</text><text class="m" x="10" y="136">an empty 304</text>
</svg>
<figcaption>The server fingerprints the config; the client sends back the fingerprint it has. Unchanged config costs a tiny request and an empty reply, which a CDN can answer without touching the origin.</figcaption>
</figure>

Most polls now cost almost nothing: a tiny request and an empty reply, which a CDN can answer without reaching the origin at all. Because the ETag comes from the content, there's no version number to keep in step with the data. If the config is identical, the fingerprint is identical. It works for anything that speaks HTTP, including mobile apps. Freshness is still bounded by the poll interval, so for a kill switch the interval has to be short, or paired with a push. If you also want history and one-click rollback, keep a copy of each published config next to the live one; the ETag only handles change detection.

### 3. Push over long-lived connections

The most advanced option is a service that holds an open stream to every pod and SDK, over server-sent events (SSE) or gRPC streaming, and pushes a diff the moment config changes.

<figure class="fig">
<svg viewBox="0 0 680 170" role="img" aria-labelledby="x3t x3d">
  <title id="x3t">A dedicated config push service</title>
  <desc id="x3d">A config push service reads from the config store and keeps long-lived streams open to every pod and app SDK, sending diffs when config changes.</desc>
  <defs><marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="50" width="160" height="54" rx="6"/>
  <text class="t" x="22" y="71">Config store</text>
  <text class="m" x="22" y="88">source of truth</text>
  <rect class="box" x="220" y="40" width="200" height="74" rx="6"/>
  <text class="t" x="232" y="61">Config push service</text>
  <text class="m" x="232" y="78">holds open streams</text>
  <text class="m" x="232" y="94">sends diffs</text>
  <path class="ln" d="M170,77 L218,77" marker-end="url(#a3)"/>
  <rect class="box" x="480" y="10" width="190" height="38" rx="6"/>
  <text class="t" x="492" y="34">Pod</text>
  <path class="sa" d="M420,77 C450,77 450,29 478,29" marker-end="url(#a3)"/>
  <rect class="box" x="480" y="60" width="190" height="38" rx="6"/>
  <text class="t" x="492" y="84">Pod</text>
  <path class="sa" d="M420,77 C450,77 450,79 478,79" marker-end="url(#a3)"/>
  <rect class="box" x="480" y="110" width="190" height="38" rx="6"/>
  <text class="t" x="492" y="134">SDK in an app</text>
  <path class="sa" d="M420,77 C450,77 450,129 478,129" marker-end="url(#a3)"/>
  <text class="ta" x="440" y="162">gRPC / server-sent events</text>
</svg>
<figcaption>The pattern feature-flag vendors and service meshes use. Freshest, but every arrow is a connection that has to survive load balancers, deploys and scaling.</figcaption>
</figure>

I considered SSE at the time and held back, mostly out of worry about the network: how long-lived connections behave inside Kubernetes. I didn't have much reference for it then. Looking back, the worry was reasonable. These are the parts that take real work:

- **Idle timeouts.** Load balancers and ingress proxies close connections that go quiet, often after a minute or less. The server has to send heartbeats to keep streams open.
- **Buffering.** Some proxies buffer responses, which holds SSE events back until buffering is turned off for that route.
- **No rebalancing.** A long-lived connection stays on the pod it first reached. When the push service scales out, existing clients don't move, so load stays uneven until connections are recycled.
- **Reconnect storms.** Every deploy or pod restart drops its connections at once, and all those clients reconnect together. They need backoff with jitter, and a way to catch up on what they missed: SSE's `Last-Event-ID`, or simply refetching the full config on reconnect.
- **Cost per connection.** Each open stream holds memory and a file descriptor on the server.

None of these is a blocker. Feature-flag vendors and service meshes run exactly this pattern. But each is engineering you have to own, so it's worth it when you have many clients and a strict freshness requirement, not before.

### Side by side

| Design | Freshness | Read cost | Moving parts | Main risk |
| --- | --- | --- | --- | --- |
| What we built | seconds; one TTL if an event is lost | Firestore on cache misses only | event channel, Redis, TTL | event and cache paths drifting apart |
| Firestore listeners | seconds | initial load + each change, per listener | Firestore only | open connections; reconnect re-reads |
| ETag polling | the poll interval | near zero; mostly empty 304s | a config endpoint, optional CDN | staleness up to one interval |
| Push over SSE or gRPC | under a second | none per read | a service holding many streams | long-lived connections through Kubernetes networking |

For the scale we had, around ten changes a day and a few dozen pods, I'd move the backend to **Firestore listeners** with a slow resync as a backstop. It deletes the most moving parts and keeps the freshness we needed. Apps would stay on server-side assignment, for the kill switch. If client count or read volume grew by an order of magnitude, I'd move to **ETag polling** behind a CDN, and add push over long-lived connections only if sub-second freshness became a hard requirement.

## What I took from it

If a system reads something far more often than it changes, look at what you're paying for the reads, in money and in latency. Polling is the easiest design to build and the hardest to notice, because each poll is tiny and the total only shows up on the bill.

The version I'd defend now:

- make reads free (serve them from memory) and make changes loud (push them);
- pick the staleness bound from the kill switch, not from cost;
- keep assignment in one place you control;
- and before adding infrastructure to push changes, check whether your data store can already push them.

## References

1. Google. *Cloud Firestore pricing*. Firebase documentation. <https://firebase.google.com/docs/firestore/pricing> — per-document read billing and listener reconnect charges
2. Google. *Get realtime updates with Cloud Firestore*. Firebase documentation. <https://firebase.google.com/docs/firestore/query-data/listen>
3. Fielding, R., Nottingham, M. and Reschke, J. *HTTP Semantics*. RFC 9110, IETF, 2022. <https://www.rfc-editor.org/rfc/rfc9110.html> — ETag, If-None-Match and 304 Not Modified
4. Fielding, R., Nottingham, M. and Reschke, J. *HTTP Caching*. RFC 9111, IETF, 2022. <https://www.rfc-editor.org/rfc/rfc9111.html>
5. WHATWG. *HTML Living Standard: Server-sent events*. <https://html.spec.whatwg.org/multipage/server-sent-events.html> — Last-Event-ID and reconnection
6. gRPC authors. *Core concepts, architecture and lifecycle*. grpc.io. <https://grpc.io/docs/what-is-grpc/core-concepts/> — server-streaming RPCs
