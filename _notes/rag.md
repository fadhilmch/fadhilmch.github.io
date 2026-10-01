---
layout: note
title: RAG
tag: agents
links:
- retrieval-recall
- groundedness
- evals
---

Retrieval-augmented generation searches a document collection, then writes an answer using the retrieved context. Keep retrieval and answer quality separate: finding the right document does not guarantee the model uses it, and a plausible answer does not prove the document was found.

Read the full example: [related post]({{ '/posts/evaluating-an-agent-honestly/' | relative_url }}).
