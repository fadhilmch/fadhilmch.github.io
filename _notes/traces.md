---
layout: note
title: Distributed traces
tag: mlops
links:
- observability
- serving
---

A trace follows a request through the services and steps it touches. It lets a slow or failed prediction be inspected as one chain rather than unrelated log lines. In a serving interface, tracing is useful as a shared platform default, while model-specific behaviour still needs its own checks.

Read the full example: [related post]({{ '/posts/a-serving-sdk-data-scientists-actually-use/' | relative_url }}).
