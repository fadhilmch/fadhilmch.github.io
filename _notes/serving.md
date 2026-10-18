---
layout: note
title: Serving SDK
tag: mlops
links:
- traces
- latency
- kubernetes
---

A trained model is not yet a service. The shared path should own the repeated work - authentication, tracing, deployment conventions - and stay narrow: a small ordinary path, inspectable behaviour, errors that suggest the next action. Defaults save configuration; hiding everything makes debugging impossible. When a serving change goes wrong I start at the trace and the p95, not the model.

Read the full example: [related post]({{ '/posts/a-serving-sdk-data-scientists-actually-use/' | relative_url }}).
