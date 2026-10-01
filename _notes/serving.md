---
layout: note
title: Model serving
tag: mlops
links:
- sdk-design
- traces
- latency
---

A trained model is not yet a service. A shared serving path handles the repeated work around it: authentication, tracing, deployment conventions and orchestration. Keep the supported path narrow and explain failures clearly. The post distinguishes the interface I built from general design advice I would apply now.

Read the full example: [related post]({{ '/posts/a-serving-sdk-data-scientists-actually-use/' | relative_url }}).
