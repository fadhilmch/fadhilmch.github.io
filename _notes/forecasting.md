---
layout: note
title: Forecasting
tag: models
links:
- gam
---

Pick the simplest model that captures your seasonality: exponential smoothing as the baseline to beat, ARIMA/SARIMA for short well-behaved series, Prophet when you have multiple seasonalities, holidays and gaps and want sane defaults. Gotchas: evaluate on rolling-origin splits, never a random split; a forecast is a distribution, so report intervals; and check residuals per season, not just overall.

Reference: [Prophet](https://facebook.github.io/prophet/).
