---
layout: note
title: GAMs & LASSO
tag: models
links:
- forecasting
---

A GAM fits one smooth curve per feature and adds them up - flexible shape, still readable effects; it was my thesis workhorse with leading indicators. LASSO pulls the other lever: keep the model linear and let the penalty push useless coefficients to zero. Reach for a GAM when the curve matters and LASSO when feature count does. Gotcha: smoothness is a hyperparameter - too wiggly and you are fitting noise.

Reference: [pyGAM docs](https://pygam.readthedocs.io/en/latest/).
