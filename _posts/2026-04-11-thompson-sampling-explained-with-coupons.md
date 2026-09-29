---
layout: post
title: Thompson sampling, explained with coupons
date: 2026-04-11
tags:
- exp
summary: Adaptive traffic allocation without the maths anxiety.
---

Thompson sampling gives each option a probability distribution representing uncertainty about its reward. On each decision, sample a plausible reward for every option and choose the strongest sample.

That simple step naturally balances trying uncertain choices with using choices that have performed well. It is useful when feedback arrives quickly, but it does not remove the need to define a sensible reward or protect against long-term effects that arrive slowly.
