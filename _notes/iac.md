---
layout: note
title: Infra as code
tag: mlops
links:
- kubernetes
---

Every environment change arrives as a reviewed diff, not a console click. Modules keep the repeated shape - service, database, bucket - in one place; keep them small and their variables honest, because a module with forty knobs is a second API nobody documented. Gotchas: state is the source of truth, so protect it and never hand-edit it; and the plan output is the review artifact - read it like a diff.

Reference: [Terraform modules](https://developer.hashicorp.com/terraform/language/modules).
