# Stockholm stroller bus planner

Own round-based earliest-arrival search over Trafiklab SL GTFS Regional Static. Non-bus routes and lines 1-6 are removed during preprocessing, before searches. Physical platforms, pickup/dropoff restrictions, service dates/exception dates, previous-day after-midnight trips, general and trip-specific transfers are preserved. Labels remain separate per arriving trip to honor transfer restrictions.

Search runs in a Web Worker on the phone. Limit: 4 hours, at most 5 buses, access/egress stops within 650 m straight-line radius. Access walks use 1.35 distance factor and 0.9 m/s plus a minute; these are estimates, not street routing. Transfers come from GTFS. Routing ignores live delays/cancellations. Unknown frequency and transfer features fail the build. Dataset expires if absent for today or build older than 48 hours.

Daily refresh uses standard public GitHub Actions runners and the TRAFIKLAB_GTFS_KEY repository secret. No secret is shipped. Generated daily files are gzip, decompressed with the browser's DecompressionStream. Old browsers without that API aren't supported. Daily download measured 3.35 MB Saturday / 4.98 MB Monday, 34.5 / 51.5 MB decoded. No actual physical phone benchmark yet.

Tests:
- node --test scripts/stroller-bus/*.test.cjs
- python scripts/stroller-bus/import.test.py

Real data validation 2026-10-03:
- Vasaparken -> Odenplan at 16:00: bus 61 departs 16:07:18, arrives 16:10:00. Exact scheduled match with SL v2.
- Vasaparken -> Stadsbiblioteket: bus 61 departs 16:07:18, arrives 16:13:00. Exact scheduled match with SL v2.
- Odenplan -> Gullmarsplan: own router finds 61 -> 74 -> 168. Each leg checked separately in SL v2; same lines and stops, schedule endpoints match within 4 seconds. SL's unconstrained route suggestions prefer 4 and 1 for some portions, showing why post-filtering would lose alternatives.
- Laptop/headless browser 390px: data load and search about 1.2 sec. Local stop-to-stop engine ~73 ms short trip / ~356 ms three-bus trip after pruning. Not a physical-phone guarantee.

The older app.js and route.js filter helper is retained but not the main page; only route.js's key-free location lookup is reused. No gate-terminal exclusion per owner request. Official fare reminder remains, since buses-only and excluding 1-6 does not guarantee free travel.

Sources:
- https://www.trafiklab.se/api/gtfs-datasets/gtfs-regional/
- https://raw.githubusercontent.com/trafiklab/openApi-docs/master/gtfsRegionalStatic.yaml
- https://gtfs.org/documentation/schedule/reference/
- https://www.trafiklab.se/api/other-apis/sl/journey-planner-2/
- https://sl.se/aktuellt/nyheter/barnvagn-pa-buss-1-2-3-4-och-6
