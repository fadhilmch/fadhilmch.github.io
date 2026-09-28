---
layout: post
title: Go worker pools for experiment assignment
date: 2025-12-06
tags:
- mlops
summary: Keeping P95 under 100 ms when traffic spikes tenfold.
---

A high-throughput assignment service needs bounded concurrency, predictable latency and a clear response to backpressure. Go worker pools make the concurrency limit explicit: work enters a queue, a fixed set of workers handles it, and overload has a policy instead of creating unbounded goroutines.

Load testing is useful only when the request shape and duration are stated. In this case, the service sustained more than 50,000 requests per second in a 30-minute distributed load test, with P95 latency below 100 ms. That is a test result, not a claim about average production traffic.
