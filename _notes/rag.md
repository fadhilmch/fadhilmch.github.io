---
layout: note
title: Retrieval
tag: agents
links:
- evals
- triage
---

Retrieval-augmented generation finds documents, then writes an answer from them. Keep the two scores separate: recall asks whether the expected sources reached the context, groundedness asks whether the answer stayed inside them. A wrong answer with good recall is a writing problem; poor recall is a search problem, and the fixes differ. Check the expected-source set itself before trusting either number.

Read the full example: [related post]({{ '/posts/evaluating-an-agent-honestly/' | relative_url }}).
