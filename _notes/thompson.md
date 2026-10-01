---
layout: note
title: Thompson sampling
tag: exp
links:
- bandits
---

Sample one possible reward rate from each option's posterior, then choose the option with the highest sampled rate. Uncertainty supplies exploration: an option with little evidence can still win a draw. In the production pattern described in the post, repeated draws become allocation weights written by a batch job.

Read the full example: [related post]({{ '/posts/thompson-sampling-explained-with-coupons/' | relative_url }}).
