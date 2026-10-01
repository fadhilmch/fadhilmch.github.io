---
layout: note
title: Feedback triage
tag: agents
links:
- observability
- human-review
---

A thumbs-down starts an investigation, not a diagnosis. The workflow I built replays the question, collects evidence, distinguishes a content gap from a configuration issue, and routes the case to an owner. Routing is ordinary code; the model proposes the likely cause. Doubtful cases go to a person rather than turning confidence into authority.

Read the full example: [related post]({{ '/posts/an-agent-that-triages-its-own-feedback/' | relative_url }}).
