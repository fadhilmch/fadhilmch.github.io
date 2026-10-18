---
layout: note
title: Thompson sampling
tag: exp
links:
- ab-testing
---

Reach for it when traffic is live and a fixed A/B test would keep sending users to a losing arm: sample each arm's posterior, serve the highest draw, and let uncertainty supply the exploration. In the production pattern from the post, a batch job turns repeated draws into allocation weights - request handling reads the split, it does not sample per request. Watch out: slow rewards make new arms look worse than they are, reset the counts when an arm's content changes, and floor the exploration or a bad arm never quite dies.

Read the full example: [related post]({{ '/posts/thompson-sampling-explained-with-coupons/' | relative_url }}).
