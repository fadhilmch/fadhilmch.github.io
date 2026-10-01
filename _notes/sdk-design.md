---
layout: note
title: SDK design
tag: mlops
links:
- serving
---

An SDK is an interface for model authors. Sensible defaults reduce repeated configuration, but hiding every detail makes debugging harder. Make the ordinary path small, leave important behaviour inspectable, and write errors that suggest the next action. These are design choices, not evidence that a particular interface is always right.

Read the full example: [related post]({{ '/posts/a-serving-sdk-data-scientists-actually-use/' | relative_url }}).
