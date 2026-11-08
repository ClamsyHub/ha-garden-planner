# Roadmap / Entwicklungsplan

- **Phase 1 – architecture:** agreed direction: integration, panel, SQLite and
  one repository for HACS/Marketplace. Complete.
- **Phase 2 – foundation:** local Git repository, MIT license, manifest/hacs.json,
  CI definitions, structural tests and bilingual documentation. Complete.
- **Phase 3 – backend:** plant/variety/location CRUD, cultivations/events, worker,
  migrations, history, import/export, backup and restore; real HA adapter tests.
  Implemented in phase 3, including basic config flow and authenticated WebSocket API.
- **Phase 4 – frontend:** seven navigation areas, forms, month/week/year calendar,
  filters, snapshots/history, localization, responsive and accessible design;
  TypeScript checks, frontend tests, reproducible bundle and browser tests.
  Implemented in phase 4; automatic HA panel registration is completed in phase 5.
- **Phase 5 – integration:** automatic panel, native entities, live temperature
  reads, editor grants, opt-in reminders and bounded authenticated HTTP transfer.
  Isolated HA matrix, frontend and actual Docker setup/restart tests. Complete.
  Published HACS/Marketplace installation/update evidence belongs to phase 6.
- **Phase 6 – publication:** approved public repository and development release
  v0.1.0, successful mandatory GitHub CI, actual HACS/Marketplace installation,
  re-download and restart tests. Complete; see [evidence](publication.md).
- **Phase 7 – catalog:** owner-approved regular v0.1.1 published; public store
  upgrades verified. [PR #13526](https://github.com/hacs/default/pull/13526) submitted.
  Awaiting maintainer triage and acceptance; catalog membership is not complete.

Version 0.1.5 is published as a regular early-development release. Feature releases and 1.0.0 require passing runtime tests.
Later scope: photos, seed stock, yields, crop rotation, companion planting and
weather history. No unsourced horticultural claims or private user data in samples.
