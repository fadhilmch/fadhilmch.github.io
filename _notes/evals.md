---
layout: note
title: Evaluating an agent
tag: agents
links:
- golden-dataset
- rag
- observability
---

A fluent answer proves nothing, so evaluate the loop rather than the vibe. Compare relevance, retrieval recall, groundedness and latency against a baseline, and read examples next to the scores: grounded, useful and found-the-right-document are three different failures. Offline golden sets give controlled comparisons; production feedback shows what the set missed, and a thumbs-down needs investigation before it means anything. My workflow produces a report for engineers rather than an automatic gate - a choice, not a rule.

Read the full example: [related post]({{ '/posts/evaluating-an-agent-honestly/' | relative_url }}).
