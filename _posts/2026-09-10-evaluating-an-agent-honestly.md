---
layout: post
title: Evaluating an agent honestly
date: 2026-09-10
tags:
- agents
summary: Relevance, recall, groundedness and latency, and why none of them is enough
  on its own.
---

A single score cannot tell you whether an agent is useful. Relevance, retrieval recall, groundedness and latency each catch a different failure, and each can look healthy while the user still gets a poor answer.

I use evaluations as engineering evidence: compare a change with a baseline, inspect failures, then decide what to change. Offline checks help before release; online evaluation helps find regressions that the test set did not anticipate. Neither should be treated as a substitute for understanding the task.

The practical lesson is to make evaluation part of the development loop and keep the reports legible to the people making the next decision.
