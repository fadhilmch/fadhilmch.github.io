---
layout: note
title: Distributed traces
tag: mlops
links:
- observability
- serving
- latency
---

A trace follows one request through every service and step it touches, turning a slow or failed call into one chain instead of unrelated log lines. Make tracing a platform default in the serving path so every model gets it for free; model-specific behaviour still needs its own checks. Gotchas: spans without consistent naming are expensive soup; sample hard in volume but never sample errors; and propagate context through queues, or the chain breaks at the async boundary.

Reference: [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/). Read the full example: [related post]({{ '/posts/a-serving-sdk-data-scientists-actually-use/' | relative_url }}).
