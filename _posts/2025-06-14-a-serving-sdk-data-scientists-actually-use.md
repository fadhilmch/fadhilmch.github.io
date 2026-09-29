---
layout: post
title: A serving SDK data scientists actually use
date: 2025-06-14
tags:
- mlops
- design
summary: An SDK is an interface. Design it like one.
---

An SDK is an interface for engineers. If every model author has to learn cluster setup, authentication, tracing and deployment conventions before shipping a model, the platform is exposing its machinery instead of helping with the task.

A useful serving SDK gives teams a narrow, consistent path to production while keeping the operational guarantees in the platform. The interface needs examples, sensible defaults and errors that tell users what to do next.
