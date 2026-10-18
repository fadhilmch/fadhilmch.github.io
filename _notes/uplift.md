---
layout: note
title: Uplift modeling
tag: exp
links:
- ab-testing
- thompson
---

Model who changes behaviour because of the message, not who converts anyway. Split the audience: persuade them (target these), sure things (wasted spend), sleeping dogs (leave alone - the message backfires). Gotchas: you never observe the counterfactual, so evaluate with uplift or Qini curves on a held-out randomized group, not accuracy; and a strong outcome model is not an uplift model.

Reference: [scikit-uplift docs](https://www.uplift-modeling.com/en/latest/).
