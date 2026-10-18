---
layout: note
title: Mixed-integer optimization
tag: data
links:
- kubeflow
---

Assign discrete resources - which truck, which delivery slot - under constraints, with a cost to minimize. I run the ops side of one in production: CVXPY to prototype the model, Kedro to keep the pipeline reproducible. Gotchas: the model is the easy half, and bad input data surfaces as infeasible at 6am; always keep a fallback plan for solver timeouts, and log the optimality gap, not just the objective.

Reference: [CVXPY](https://www.cvxpy.org/).
