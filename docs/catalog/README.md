# Phase 7 — catalog preparation

Prepared 2026-11-06. **No catalog PR, fork or v0.1.1 release has been published.**

## Concrete proposal

- Publish candidate **v0.1.1** as an ordinary GitHub release, after explicit owner
  approval and the complete protected release workflow. It is an early 0.x version,
  not a claim of stable 1.0 maturity.
- The candidate includes the accepted week-view/sensor-picker fixes and the patched
  HA >=2026.7.0 minimum. Existing database schema 2/exchange 1 remain unchanged.
- Then create a personal-account fork of hacs/default if needed, branch from master,
  and submit **Add ClamsyHub/ha-garden-planner** with maintainer edits enabled.
- No individual maintainer reviews will be requested. Submission is not acceptance.

This additional release needs explicit approval: previous publication approval was
for v0.1.0 only. The owner has asked to proceed with phase 7; the complete proposal
is being made reviewable before the external actions.

## Why prepare another release?

v0.1.0 is a published development pre-release and lacks the recent accepted fixes
and updated security floor. The current upstream Releases check calls GitHub's
`/releases` endpoint and accepts any nonempty list; it does **not** explicitly
exclude pre-releases or require version 1.0. Preparing an ordinary, current release
is our publication choice for default-store availability and consistent metadata,
not an invented upstream minimum-version rule. The `/releases/latest` endpoint
currently returns 404 because this project only has the v0.1.0 pre-release.

## Prepared files

- [PR body](PR_BODY.md): exact current upstream checklist and a concise English
  description. Release checkbox/links stay visibly pending until they are true.
- [Single-entry patch](add-garden-planner.patch): the only intended upstream change.
- [v0.1.1 notes](../releases/v0.1.1.md): compatibility, changes and migration status.

The patch adds `ClamsyHub/ha-garden-planner` between
`Clahen86/ha-replace-device` and `Clap404/ha-danfoss-eco`. All lists pass upstream
`scripts/is_sorted.py`; JSON and whitespace validation pass.

## Readiness audit

| Requirement | Evidence/status |
|---|---|
| Personal repository owner | ClamsyHub verified via GitHub API; public, not archived |
| Metadata | Description, topics, enabled issues, README/screenshots and MIT license |
| Structure/domain | One custom integration, garden_planner, bundled frontend and original local PNG icons |
| Current security alert | CVE-2026-91130 automatically fixed on main; no open Dependabot alerts at audit |
| Existing install evidence | v0.1.0 installed through HACS and native Marketplace; see publication.md |
| New candidate checks | Local validation passed; [details](validation.md). GitHub CI is collected before approval |
| Existing catalog/blacklist/critical/removal | No conflicting entry in the exact upstream lists |
| Core-domain collision | No garden_planner in the complete official Core dev components tree |
| Upstream website collision check | next.home-assistant.io returned HTTP 403 here; direct Core tree used as cross-check, not a falsely reported successful website check |
| v0.1.1 regular public release | Pending owner approval, validation and publication |
| External submission | Pending completion of checklist; no PR submitted |

Upstream baseline: `hacs/default` master commit
`661489b43dba5cd9b1ac2e653008e14d74434433`. Refresh/rebase the single-entry patch
before submission. The JSON sort key is case-folded, while the repository spelling
retains its actual case. Current upstream brand checks accept local icons; no
unnecessary brands-repository PR is prepared.

## Final submission steps

1. Review final candidate CI and obtain v0.1.1 publication approval.
2. Publish only the tested commit through the main-only protected environment.
3. Download/verify the public ZIP/checksum and test the actual store upgrade.
4. Replace pending PR links with real successful run/job permalinks and published
   release URL; check the release checkbox only after publication.
5. Refresh the upstream patch, fork/branch as the owner, and submit with the complete
   template. Do not skip upstream checks, request reviews or claim inclusion early.
6. Monitor actual upstream results and maintainer feedback. Acceptance/review timing
   remains outside this project's control.

## Official sources

- https://contributors.home-assistant.io/marketplace/guides/catalog/
- https://www.hacs.dev/docs/publish/include/
- https://github.com/hacs/default/blob/master/.github/PULL_REQUEST_TEMPLATE.md
- https://github.com/hacs/default/blob/master/scripts/check/releases.py
- https://github.com/hacs/default/blob/master/.github/workflows/checks.yml
