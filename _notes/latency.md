---
layout: note
title: P95 latency
tag: systems
links:
- go-workers
- serving
---

P95 describes the point below which 95% of measured request times fall. It says more about slow requests than an average, but still needs a workload and measurement window. A load-test result is not a promise about production traffic. Bounded concurrency controls how much work a service accepts at once.

Read the full example: [related post]({{ '/posts/go-worker-pools-for-experiment-assignment/' | relative_url }}).
