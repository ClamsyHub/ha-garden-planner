# Publication report — v0.1.0

Date: 2026-11-06. First public **development pre-release**, not stable 1.0.

- Repository: https://github.com/ClamsyHub/ha-garden-planner
- Release: https://github.com/ClamsyHub/ha-garden-planner/releases/tag/v0.1.0
- Tested/released commit: `73b34146107608b12105d5841d47bd9dd3b31eda`.
- Release workflow: https://github.com/ClamsyHub/ha-garden-planner/actions/runs/42203562849
- Initial standalone validation: https://github.com/ClamsyHub/ha-garden-planner/actions/runs/42202985985
- Initial standalone tests: https://github.com/ClamsyHub/ha-garden-planner/actions/runs/42202986124

## Published and checked

All required jobs in the release workflow completed successfully before publication:
repository/lint/strict types, Hassfest, HACS Action without ignored checks, 47 backend
and packaging tests, 19 native HA tests in each matrix environment, 16 frontend unit
tests, 48 Chromium/mobile/WebKit cases, npm audit, strict TypeScript, formatting and
exact frontend rebuild. The HA matrix includes pinned 2026.6.0 and current stable.

The protected `release` environment restricts publication to main and requires
ClamsyHub approval. The owner explicitly authorized self-review for this single-account
project and approved this release. Future releases still require owner approval.
Publication is manually dispatched, never triggered by an arbitrary push or PR.

Published assets: `garden_planner.zip` and `SHA256SUMS`. The ZIP contains only the
integration-relative runtime files and MIT license. The build fixes ordering,
timestamps and permissions. The downloaded public asset matches its checksum;
installed files match the ZIP byte-for-byte. Original PNG icons ship locally in
brand/; no Home Assistant artwork is used. Database schema remains 2, exchange 1.

## Real installation checks

Two newly created official Home Assistant Containers used separate temporary
configurations, loopback-only ports and synthetic records. Garden Planner was
**not preinstalled**. Only test accounts were onboarded; the existing configured
GitHub credential was privately seeded for the test-store connection rather than
repeating the device authorization UI. Tokens stayed outside the repository and
are removed with the test configurations.

| Environment | Actual installation path | Result |
|---|---|---|
| HA 2026.6.0 + unmodified HACS 2.0.5 | Add custom integration repository; show pre-releases; native download v0.1.0 | Passed |
| HA 2026.11.0 native Marketplace | Accept native warning; add custom integration repository; show pre-releases; native install v0.1.0 | Passed |
| Both | Native Garden Planner config flow, automatic panel, five sensors + calendar | Passed |
| Both | Authenticated HTTP export, default reminders off, synthetic plant/culture | Passed |
| Both | Native re-download/reinstall v0.1.0 and HA restart | Passed; original record IDs retained |
| Both | Actual native HA frontend loads panel and displays stored plants | Passed; no browser errors |

The same-version reinstallation exercises replacement/preservation through both
stores. It is not a transition between two published versions: no earlier public
version exists. Migration/restore behavior has automated tests; the next actual
version transition must be checked before the next release. The native browser checks were performed after completing HA onboarding. One
initial HACS-host navigation produced an unspecific unhandled browser object;
a diagnostic rerun tracking failed native WebSocket commands completed cleanly.
No error rule was disabled or application code changed to suppress it. Physical
devices and Companion Apps still need practical testing.
No productive HA/Synology files were touched.

## Repository security and approvals

GitHub account ClamsyHub was verified through the API. Commit author uses GitHub's
noreply address. Source and artifact checks found no credentials, private HA
configurations or runtime databases. GitHub secret scanning/push protection,
private vulnerability reporting and dependency alerts are enabled. Dependency
version-update PRs are paused pending separate approval; no update was merged.
The initial automatically generated version proposals were closed. This setting
does not turn off security alerts or change security-update limits.

## Distribution milestones

1. Public GitHub repository and development release: **complete**.
2. Installation as a Custom Repository in HACS and Marketplace: **tested**.
3. Official community catalog membership: **not submitted / not accepted**.

Catalog submission belongs to phase 7 and requires separate explicit approval.
No upstream PR or brands-repository submission was made. The current validators
accept the integration's local brand folder. Maintainer acceptance is required
before claiming catalog membership.
