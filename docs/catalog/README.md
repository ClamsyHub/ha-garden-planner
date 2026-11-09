> Current release: [latest public release](https://github.com/ClamsyHub/ha-garden-planner/releases/latest). Catalog inclusion was accepted on 2026-11-09. The original submission evidence below documents v0.1.1.

# Phase 7 — accepted into the official community catalog

Status verified 2026-11-09. [PR #13526](https://github.com/hacs/default/pull/13526)
was approved and merged by `frenck` at **12:46:53 UTC / 13:46:53 Europe/Berlin**.
`ClamsyHub/ha-garden-planner` is present in the upstream `hacs/default` integration list.
This completes official catalog inclusion. Store clients may need to refresh their catalog.

The reviewer requested catalog-search-first German/English installation instructions
and an up-to-date release link. These are addressed in v0.1.6. Custom repositories
remain a fallback, and existing installations keep their data.

The evidence below records the original v0.1.1 installation and submission tests;
it is historical evidence, not a statement that current catalog acceptance is pending.

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
