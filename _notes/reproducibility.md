---
layout: note
title: Reproducibility
tag: mlops
links:
- kubeflow
---

Same data, same code, same result - or at least a record of why not. The minimum kit: pinned dependencies, versioned data or a snapshot reference, seeded randomness, and the run's config stored next to its output. "Worked on rerun" dies by a thousand unpinned cuts: a floating base-image tag, a silent data refresh, an upstream default that changed. If you cannot diff two runs, you cannot trust the second one.
