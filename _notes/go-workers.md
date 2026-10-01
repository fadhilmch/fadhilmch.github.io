---
layout: note
title: Go worker pools
tag: systems
links:
- latency
- observability
---

A bounded worker pool separates accepting work from doing it. The queue and worker limit make overload a visible choice: wait, reject, or shed work rather than spawn without limit. The firmware comparison in the post is about keeping handlers short and defining backpressure, not treating servers like microcontrollers.

Read the full example: [related post]({{ '/posts/go-worker-pools-for-experiment-assignment/' | relative_url }}).
