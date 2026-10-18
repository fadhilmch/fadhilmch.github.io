---
layout: note
title: P95 latency
tag: systems
links:
- go-workers
- serving
---

p95 means 95% of requests were faster than this. It says nothing about the worst 5%, which is where incidents live, and the mean hides them under fast cached calls. Alert on p95 or p99, never the mean; compute from raw values or a histogram with sane buckets, never by averaging percentiles across instances; pair it with a request count so a quiet hour cannot page you. A load-test p95 is not a promise about production traffic.

Reference: [Prometheus histogram docs](https://prometheus.io/docs/practices/histograms/). Read the full example: [related post]({{ '/posts/go-worker-pools-for-experiment-assignment/' | relative_url }}).
