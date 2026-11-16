# Official community catalog

Garden Planner is available in the official HACS community catalog. Search for **Garden Planner** in HACS/Marketplace and install the [latest release](https://github.com/ClamsyHub/ha-garden-planner/releases/latest). Custom repositories remain an alternative if the local catalog has not refreshed.

The evidence below records the original v0.1.1 installation and submission tests.

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
