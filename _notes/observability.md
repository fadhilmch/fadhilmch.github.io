---
layout: note
title: Observability
tag: systems
links:
- traces
- latency
- triage
---

For feedback investigation, record enough of the request to reconstruct what happened: the question, retrieval, response and relevant configuration. A trace helps connect those steps. Dashboards can show a pattern, but a concrete replay is often what tells us which component or document needs attention.

Read the full example: [related post]({{ '/posts/an-agent-that-triages-its-own-feedback/' | relative_url }}).
