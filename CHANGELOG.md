# Changelog

## 0.1.5 — 2026-11-08

- Order calendar views as year, month and week.
- Include growing-window notes in hover tooltips across all three views.
- Open a shared compact growing-window detail dialog with dates, environment and notes, followed by a plant profile.
- Keep full plant details and permitted growing-window editing accessible from the dialog.
- Preserve long notes behind an expandable preview; add keyboard, read-only and mobile WebKit regression coverage.

## 0.1.4 — 2026-11-08

- Add a persistent Home Assistant sidebar menu button, including narrow/iPhone layouts.
- Keep cultivation measurements on plants; remove retired variety values through backed-up schema-3 migration and normalize old imports.
- Make growing windows plant-wide by removing variety assignments; preserve windows, notes and historical cultivation snapshots.
- Group sowing depth and spacing form rows as requested.
- Show compact plant facts, collapsible full information and direct section shortcuts.
- Add mobile WebKit coverage, migration/rollback/old-release upgrade checks and accessibility fixes.

## 0.1.3 — 2026-11-07

- Add distinct colors, filters and year bars for all seven activities. Order calendar and plant-detail windows by cultivation phase, then start date.
- Replace editor multiselect with a per-user viewing/editing matrix; administrators retain access and existing users keep viewing access until explicitly changed.
- Add separately enabled push/email destinations per user, modern notify-entity selection and explicit legacy email recipients.
- Preserve the existing shared channel and opt-in reminder activation. Dedupe destinations, isolate delivery failures and persist per-destination reservations.
- Clarify notification entities, email addressing and native Home Assistant entity permissions.

## 0.1.2 — 2026-11-07

- Allow adding, changing and clearing a growing window’s variety within its plant; preserve cultivation history.
- Remove duplicate measurement fields from growing-window forms; retain existing data.
- Compact variety rows to name and botanical name; retain full editing fields.
- Sort plant-detail growing windows chronologically; show activity, optional variety, date range and notes.

## 0.1.1 — 2026-11-06

- Show seasonal growing windows overlapping the selected week, alongside actual tasks/events.
- Replace the native temperature-sensor datalist with an anchored, searchable and keyboard/touch-accessible picker.


- Replace vulnerable HA 2026.6 test dependency; security minimum is HA 2026.7.
- Publish through the owner-approved regular release channel; catalog PR #13526 submitted, acceptance pending.

## 0.1.0 — 2026-11-06 (development pre-release)

- First public repository and pre-release, deterministic integration ZIP/checksum.
- Protected owner-approved release workflow with all mandatory CI prerequisites.
- Original local brand assets; SHA-pinned Actions and current Marketplace category.
- Actual public-package HACS/Marketplace install and re-download/restart checks.

### Phase 5 — native HA integration

- Automatic sidebar panel with bundled static code and content-hash cache busting.
- Five count sensors, read-only task/event calendar and HA options flow.
- Admin-managed editor grants and authenticated bounded HTTP file transport.
- Optional air/soil/substrate temperature display with °C/°F/K conversion.
- Substrate-only comparison against explicitly stored germination ranges.
- Opt-in reminders with persistent attempt reservations and delivery audit state.
- Native HA tests, actual isolated Container setup and restart persistence checks.
- Correct date-field rows: start month/day together, then end month/day.
- No production deployment, public repository, release or catalog submission.

### Phase 4 — interactive frontend

- Seven German/English views with responsive light/dark layouts.
- Plant/variety/window/location CRUD, sowing capture, lifecycle, tasks and history.
- Month/week/year calendars with filters and accurate partial-month/winter bars.
- Immutable snapshot display, reviewed JSON/CSV ZIP import, export and backups.
- Explicit labels, keyboard dialogs, preserved drafts on errors and read-only UI.
- Locked frontend dependencies, distributed license notices and reproducible bundle.
- Browser tests of the built bundle against real temporary SQLite data.
- No production deployment, automatic HA panel registration or publication yet.

### Phase 3 — backend

- Validated plants, varieties, seasonal windows, beds, cultivations, lifecycle events and tasks.
- Single-worker SQLite persistence, schema migrations and optimistic edit conflicts.
- Historical snapshots, explicit success observations and multi-year history.
- Reviewed JSON/CSV imports, consistent backups and transactional restore.
- Restore revision protection against forms opened before replacement.
- Basic HA config flow, authenticated/authorized WebSocket commands and subscriptions.
- Real-file backend tests and isolated HA adapter tests; no production deployment.

### Phase 2 — foundation

- Local phase-2 repository foundation, integration metadata and MIT license.
- Structural/version/private-data validation and tests.
- Read-only validation, foundation-test and blocked release-readiness workflows.
- German and English documentation and publication approval boundaries.

v0.1.0 is the first public development pre-release. Earlier phase notes describe
their historical implementation state, not the current publication status.
