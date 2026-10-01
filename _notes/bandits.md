---
layout: note
title: Multi-armed bandits
tag: exp
links:
- thompson
- ab-testing
---

A bandit shifts allocation while learning which option performs better. That trades some fixed-test simplicity for less traffic spent on weak options. In the coupon example, Thompson sampling updates a traffic split in a batch job; request handling uses that split rather than sampling a posterior on every request.

Read the full example: [related post]({{ '/posts/thompson-sampling-explained-with-coupons/' | relative_url }}).
