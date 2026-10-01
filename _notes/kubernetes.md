---
layout: note
title: Kubernetes
tag: mlops
links:
- serving
- observability
---

Kubernetes stores desired state while controllers keep trying to make the running system match it. A Deployment manages replicas, a Service gives traffic a stable destination, and Helm packages configuration. That mental model is more useful than memorising object names without knowing which controller or traffic path they belong to.

Read the full example: [related post]({{ '/posts/making-sense-of-kubernetes/' | relative_url }}).
