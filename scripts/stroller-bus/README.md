# Stroller bus route page

Standalone static page at `/stroller-bus/`. No build step, API key or backend.

Tests: `node --test scripts/stroller-bus/route.test.cjs`

Route search uses SL Journey Planner v2, leaving now, requesting 3 bus-only suggestions. SL may return more or fewer. If no journey survives, up to three further requests try the other preferences then the original preference 30 minutes later. Maximum four trip requests per search. Results stay in API order; the user can choose fastest, fewer transfers or less walking. The filter removes any whole journey with bus lines 1-6, unknown line/mode or a non-bus transit leg. Class 99 walking legs are allowed; walking-only journeys are not. Per the owner's request, there is no terminal exclusion. The page shows the official reader/gate fare condition, not a promise of free travel.

This is not an exhaustive route planner. The SL line-exclusion parameters did not remove line 4 in our live check, so the page relies on client-side filtering. An empty result means none of SL's suggestions matched, not that no such journey exists. Do not label this page "all free bus routes".

Lookup is explicit on submit, then the user chooses the location match. No background polling, saved locations, tracking or secrets. Request timeouts are 20 seconds. API text is rendered with textContent.

Sources checked October 3, 2026:
- https://www.trafiklab.se/api/other-apis/sl/journey-planner-2/ (no key, request and response documentation)
- https://www.trafiklab.se/openapi/sl-journey-planner.json (transport classes, parameters)
- https://sl.se/aktuellt/nyheter/barnvagn-pa-buss-1-2-3-4-och-6 (fare conditions)
