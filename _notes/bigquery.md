---
layout: note
title: BigQuery
tag: data
links:
- metrics-layer
---

Where most experiment analysis in my posts actually ran: storage separated from compute, SQL over terabytes without owning a cluster. Costs follow bytes scanned, so the gotchas are all about reading less: partition by the date you filter on, cluster by the keys you group on, select only the columns you need, and dry-run a query to see its bytes before it bills you.

Reference: [BigQuery docs](https://cloud.google.com/bigquery/docs/introduction).
