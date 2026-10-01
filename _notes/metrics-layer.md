---
layout: note
title: Metric semantic layer
tag: exp
links:
- ab-testing
- self-service
---

A metric definition includes more than a formula: its population, event, time window and owner matter too. The platform I describe stored those definitions as metadata and used a BigQuery query engine to compute them. Reusing one definition helps only when teams can find it and know who maintains it.

Read the full example: [related post]({{ '/posts/one-definition-of-conversion/' | relative_url }}).
