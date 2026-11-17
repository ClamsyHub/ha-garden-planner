# Changelog

## 0.1.11 — 2026-11-17

- Confirm manual and personal task completion before removing upcoming work; cancellation and Escape leave tasks untouched.
- Add shared Neighbors management with reciprocal good/bad catalog relationships, multiple choices and optional free names.
- Add a responsive Seeds & shopping matrix with available, buy, not-needed and undecided states, filtering and automatic transactional batch saves.
- Make overview counts navigate to matching filtered views and upcoming work; keep a compact summary visible while scrolling.
- Make calendar legend activities exclusive quick filters with a second click restoring all activities; retain dropdown multi-selection.
- Keep seed choices responsive during saving, preserve newer choices and expose explicit recovery after failed saves.
- Retain shared garden edit permissions, optimistic concurrency, JSON/CSV exchange and backups. Accept existing CSV plant headers without the new optional metadata.

## 0.1.10 — 2026-11-16

- Show inclusive start and end dates for generated activity-period tasks in the overview and task list, including winter periods.
- Save end dates with private tasks, update open entries and retain completed history. Legacy tasks remain readable; notification scheduling and completion semantics are unchanged.

## 0.1.9 — 2026-11-16

- Rename the calendar and periods to Garden calendar / activity periods (Gartenkalender / Tätigkeitszeiträume), retaining stored identifiers and existing data.
- Add Fertilize and Prune activities to period/task forms, calendar views, filters, distinct colors and personal reminder selections.
- Generate private tasks for the new activities and notify them through existing opt-in push/email routes.
- Contain native iOS date/month controls within an explicitly sized column, remove native appearance sizing and preserve space for navigation arrows.
- Remove catalog acceptance names, dates and submission links from current documentation.

## 0.1.8 — 2026-11-16

- Apply reminder selections immediately without locking the matrix; coalesce rapid changes into bounded, authenticated batches and update only affected rows.
- Preserve newer choices while a save is pending; restore confirmed values on failure and drain pending changes before internal navigation.
- Reduce the sticky plant column on phones and keep long names within its width, leaving room to scroll activities.
- Keep multi-select calendar filters at a stable width, align their labels/controls, and close menus on outside clicks or Escape.
- Align calendar date navigation and wrap the Today button on narrow displays to avoid overlaps.

## 0.1.7 — 2026-11-16

- Add a personal Reminders page between Locations and Settings, available to every authorized user including read-only users.
- Generate private, completable annual tasks from growing-window selections; retain completed history and route due-task notifications through existing settings.
- Select growing-window tasks per plant/activity with available cells enabled by default and missing activities disabled. New activity generations default back on.
- Persist personal opt-outs in authenticated HA user profiles without changing garden database schema or global notification opt-in.
- Notify saved tasks only, preserving historical window delivery reservations to prevent upgrade duplicates; retain shared manual task notifications.

## 0.1.6 — 2026-11-09

- Allow multiple calendar categories and activities, combined consistently across year, month and week.
- Keep year headings and the top-left corner visible in a bounded, scrollable year grid.
- Synchronize revoked viewing with native per-user sidebar preferences; restore only integration-owned hides and retain administrator access. Track new users and role changes.
- Lead installation documentation with official catalog search following HACS acceptance on 2026-11-09; retain custom repositories as a fallback.

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
