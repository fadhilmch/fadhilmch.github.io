---
layout: note
title: Multi-agent systems
tag: agents
links:
- evals
- observability
---

Before adding agents, ask whether the work splits into independent pieces that each need a large separate context and can run in parallel. Then a team can pay off: Anthropic's research system runs parallel subagents, beats one agent on broad queries, and costs roughly 15x the tokens. Dependent steps - clarify, retrieve, answer - are a pipeline, not a team: one agent, explicit stages, plain code between them. Chained agents in the live path are where the latency and maintenance pain shows up.

Source: [Anthropic on their multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
