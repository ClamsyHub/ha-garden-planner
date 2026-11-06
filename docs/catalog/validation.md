# v0.1.1 catalog candidate validation

2026-11-06. Candidate only; no v0.1.1 publication or upstream submission yet.

| Check | Local result |
|---|---|
| Backend, package and release-channel guard tests | 50 passed |
| Native HA 2026.7.0 | 19 passed |
| Native HA 2026.11.0 | 19 passed |
| Frontend unit tests | 18 passed |
| Desktop/mobile Chromium and WebKit | 54 passed; no skips/retries |
| Strict TypeScript / Prettier | Passed |
| Ruff lint / formatting | Passed |
| Strict mypy against patched minimum | 34 source files passed |
| Repository / matching versions / release readiness | Passed for v0.1.1 |
| Runtime bundle and license rebuild comparison | Byte-for-byte match |
| Upstream integration JSON/type/pattern/sort/whitespace | Passed |
| Existing catalog/blacklist/critical/removed entries | No conflicting entry |

## Real pre-publication upgrade test

A new official HA 2026.11.0 Container used only a temporary configuration and a
loopback port. The public v0.1.0 ZIP was installed first. Native onboarding/config
flow created a synthetic owner and Garden Planner entry. A plant and cultivation
were saved, then the Container was stopped and the complete candidate ZIP replaced
only the component files. After restart:

- The entry loaded and the automatic native panel remained registered.
- The same plant/cultivation records, revisions and notes were unchanged.
- Five native sensors and one calendar entity were present.
- HTTP served the exact tested v0.1.1 bundle; export still reports schema 2.
- Notifications stayed off. No database migration was needed.

The Container/configuration were removed; tokens only lived in process memory or
the temporary HA configuration. The owner's own test Container and production
installation were not changed by this test. This is a real archive-to-archive
manual upgrade, not yet a public HACS/Marketplace v0.1.1 download test; that final
check follows approved publication.

## Domain-check caveat

The upstream next.home-assistant.io endpoint returned HTTP 403 from this environment.
The complete official Core dev components tree was checked instead, without
truncation: SHA `670573f11dc9a6514efc630f884a80dbb501cc58` contains no garden_planner
directory. We do not describe the failed website fetch as a passed test. Upstream
CI repeats its own endpoint check after any actual PR submission.

## Completed external evidence

[Protected release workflow](https://github.com/ClamsyHub/ha-garden-planner/actions/runs/42249493733)
completed all nine jobs successfully. The owner-approved regular v0.1.1 is public.
Actual public-package HACS/Marketplace upgrades preserved all exported garden tables.
See [submission status and test matrix](README.md). Maintainer acceptance remains pending.

## Build reproducibility investigation

The first candidate CI correctly rejected a JavaScript byte mismatch. Local builds
had reused an external node_modules tree. A clean npm ci from the same lockfile
in this checkout generated the same-size output as the Linux runner. The exact
comparison remains mandatory; the regenerated artifact and all browser tests are
passed on the final release commit. No failed check is ignored or disabled.
