---
layout: note
title: Metric semantic layer
tag: exp
links:
- ab-testing
- bigquery
---

A metric is more than a formula: population, event, time window and owner. Store definitions as metadata that people and programs can both read, and let a query engine compile them - the post's platform did this on BigQuery with 100+ reusable definitions. Self-service works only when the shared path is easier than writing another private SQL query; discoverability and ownership are the actual product.

Read the full example: [related post]({{ '/posts/one-definition-of-conversion/' | relative_url }}).
