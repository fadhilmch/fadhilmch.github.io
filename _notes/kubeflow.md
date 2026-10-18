---
layout: note
title: Kubeflow Pipelines
tag: mlops
links:
- reproducibility
- kubernetes
- serving
---

Kubeflow Pipelines turns train-test-deploy into a DAG of containerized components on Kubernetes, each with explicit inputs and outputs. It earns its weight when pipelines are long, rerunnable and shared; a two-step nightly job is happier as a script. Gotchas: a component is a container, so pin its image and arguments or "reproducible" is a rumor; caching is input-based, so data that changes silently under the same inputs replays stale results.

Reference: [Kubeflow Pipelines docs](https://www.kubeflow.org/docs/components/pipelines/).
