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
- **Phase 6 – publication:** only after explicit approval: public GitHub repository,
  approved tag/release, custom-repository installation/upgrade test and screenshots.
- **Phase 7 – catalog:** prepare an English PR to hacs/default; submit only after
  approval. Membership is complete only when maintainers accept the PR and the
  catalog processes it.

The initial 0.1.0 metadata reserves a development version; it does not represent
a published release. Feature releases and 1.0.0 require passing runtime tests.
Later scope: photos, seed stock, yields, crop rotation, companion planting and
weather history. No unsourced horticultural claims or private user data in samples.
