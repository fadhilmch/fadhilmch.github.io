---
layout: post
title: An agent that triages its own feedback
date: 2026-08-02
tags:
- agents
- mlops
summary: Replay the question, check the evidence, route to an owner, and send the
  rest to a human.
---

Production feedback is most useful when it arrives with evidence. A triage workflow can replay a flagged question, retrieve the supporting context, classify likely content gaps versus configuration issues, and route the case to an owner.

The system should stop when evidence is missing or conflicting and ask a person to review it. The goal is to shorten investigation, not to automate certainty. The time saving is an operational estimate based on comparing the manual and automated workflows.
