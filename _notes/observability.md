---
layout: note
title: Observability
tag: systems
links:
- traces
- latency
- triage
---

Instrument so a stranger can reconstruct any request after the fact: the question, what was retrieved, the answer, and the configuration in force. Dashboards show a pattern; a concrete replay tells you which component or document to fix. Gotchas: logs without request IDs are archaeology; record versions - model, index, config - next to every answer, or "what changed" is unanswerable; and high-cardinality labels will bankrupt the metrics bill.

Reference: [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/). Read the full example: [related post]({{ '/posts/an-agent-that-triages-its-own-feedback/' | relative_url }}).
