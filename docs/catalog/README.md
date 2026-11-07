> Current release: [v0.1.3](https://github.com/ClamsyHub/ha-garden-planner/releases/tag/v0.1.3), published 2026-11-07. The original submission evidence below documents v0.1.1. Catalog acceptance remains a separate maintainer decision.

# Phase 7 — submitted, awaiting maintainer acceptance

Status checked 2026-11-06. The owner explicitly approved the regular release and submission.

- [v0.1.1 release](https://github.com/ClamsyHub/ha-garden-planner/releases/tag/v0.1.1) is public, not a pre-release. This remains an early 0.x version, not stable 1.0.
- [Protected release workflow](https://github.com/ClamsyHub/ha-garden-planner/actions/runs/42249493733): all nine jobs successful, including HACS and Hassfest before publication.
- Tested release commit: `a3626114264295756356b16eade77f80bd918a71`.
- [Catalog PR #13526](https://github.com/hacs/default/pull/13526): open, not merged; maintainer edits enabled, no individual reviews requested. Exactly one sorted integration entry is added.
- Upstream JSON, schema, sorting, editable-PR and preflight checks succeeded. The category-specific checks were skipped pending maintainer triage (no `New default repository` label yet). They are not reported as passed.
- No maintainer comments at the status check. Official catalog membership remains pending acceptance and catalog processing.

## Public release verification

The downloaded public ZIP checksum was verified, and the archive matched the tested package byte for byte. Both native store upgrade paths were exercised:

| Store | Home Assistant | Upgrade | Result |
|---|---|---|---|
| HACS 2.0.5 | 2026.7.0 | Public v0.1.0 → v0.1.1 | Successful; all seven exported garden tables unchanged after restart |
| Native Marketplace | 2026.11.0 | Public v0.1.0 → v0.1.1 | Successful; all seven exported garden tables unchanged after restart |

Both tests verified installed runtime files against the public ZIP, the automatic panel, served bundle and all six entities. Test containers and temporary credential-bearing configs were removed. Database schema 2/exchange format 1 remain unchanged; no manual migration is needed. Reminders remain opt-in.

The user-authorized local Mac test instance was also updated to this public package; all nine SQLite tables were unchanged after restart. No production Synology files were modified.

## Submission material

- [Submitted PR body](PR_BODY.md)
- [Single-entry patch](add-garden-planner.patch)
- [Validation](validation.md)
- [Release notes](../releases/v0.1.1.md)

The upstream baseline was `661489b43dba5cd9b1ac2e653008e14d74434433`. The direct website domain check returned HTTP 403 here; the complete official Core dev tree was checked as a cross-check (details in validation). This does not replace upstream CI.

## Official sources

- https://contributors.home-assistant.io/marketplace/guides/catalog/
- https://www.hacs.dev/docs/publish/include/
- https://github.com/hacs/default/blob/master/.github/PULL_REQUEST_TEMPLATE.md
- https://github.com/hacs/default/blob/master/.github/workflows/checks.yml
