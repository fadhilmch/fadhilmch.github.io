---
layout: note
title: MCP
tag: agents
links:
- multi-agent
---

MCP is a standard socket shape between a model host and its tools: servers expose tools, resources and prompts, and any client discovers and calls them the same way. Reach for it when more than one host or team must share the same tools; one app with three functions can stay a plain function list. Gotchas: a tool's description is part of the prompt, so vague names get misused; auth and what a server may see are your design, not the protocol's.

Reference: [MCP introduction](https://modelcontextprotocol.io/introduction).
