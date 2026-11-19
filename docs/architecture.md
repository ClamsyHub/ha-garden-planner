# Architecture decision – accepted direction, phase 4

## Boundaries

One repository, one domain (`garden_planner`), one shared garden per Home
Assistant instance initially. Backend: Python integration. Frontend: TypeScript,
Lit and Vite, compiled into the integration package. Main UI: auto-registered
custom panel. A Lovelace card is a later extension, not a setup requirement.
No runtime CDN imports, cloud requirement or additional container.

The local development directory is independent of the private HomeAssistant
collection and the mounted live custom_components directory. Never write to
production as part of development, tests or CI.

## Persistence design and implementation

SQLite at `/config/garden_planner/garden_planner.sqlite3`, owned by a dedicated
worker outside the HA event loop. Parameterized SQL, foreign keys, transactions,
serialized writes and optimistic record revisions. Store dates as ISO calendar
dates; event instants as UTC with explicit display timezone. Activity periods
use month/day boundaries and handle year wrap and leap years explicitly.

Implemented schema v4: plants, varieties, growing_windows, locations, cultivations,
cultivation_events, tasks, seed_lots, cultivation_journal, settings and schema_migrations. Operational delivery
reservations use namespaced settings rows; notification options live in the HA
config entry. No speculative reminder_rules table is required. Stable IDs preserve relationships. Cultivation snapshots
protect historical context from later master-data edits. Lifecycle, germination
result and harvest result are separate. Do not cascade-delete historical records.

Backup uses SQLite's consistent backup API. Migrations are versioned and tested,
with a pre-migration backup. An incompatible newer schema is refused. JSON is a
full versioned exchange format; relational CSV uses multiple linked tables.
Import validation and preview precede transactional writes.

## HA interface and authorization

Config flow and options flow, authenticated WebSocket CRUD/subscriptions,
custom-panel adapter, static bundled assets, a few aggregate SensorEntity
entities and a CalendarEntity for concrete tasks. No helper/recorder database.
Admin-only restore and global configuration. Gardening CRUD requires explicit
server-side authorization. No private per-user gardens in version 1.
Notifications default off. Persist deduplication state and define missed-run
behavior. Sensor assignment includes measurement kind: air, soil or germination
substrate. Never infer substrate temperature from an air sensor.

## Compatibility and distribution

Security floor for the next release: HA 2026.7.0; test baseline plus current stable before release.
Beta checks are early warnings. This is a project support target, not a claim
that upstream maintains old HA releases. UI text supports German and English.
Custom-integration translations ship as translations/de.json and en.json.
Phase 5 adds automatic panel registration, five count sensors, a read-only calendar,
live temperature reads, editor grants and opt-in reminder delivery. The coordinator
polls every 15 minutes and refreshes after database changes; all SQLite work stays
outside the HA event loop. ConfigEntry is passed explicitly to the coordinator
for compatibility with current HA. No schema bump is required for delivery state.

All runtime assets must live inside custom_components/garden_planner. User data
must never live there. Source tree may include the compiled bundle; CI must
rebuild and compare it once the frontend exists. Releases are the supported
distribution unit, with matching manifest/project/tag versions.


## Phase 4 frontend implementation

Lit and TypeScript compile into www/garden-planner.js using Vite, accompanied by
THIRD_PARTY_NOTICES.txt. frontend/dev contains only the test host; a repository
check rejects its transport markers in the runtime bundle. UI models mirror the
existing validated service contract, without changing schema v2. CSV files are
packaged with fflate, with bounds and filename checks on decompression. Native
dialogs, explicit form labels and cross-browser focus are checked with Playwright
and axe. The panel is registered through panel_custom; static code is exposed with
HA static-path registration and a content-hash URL. Private data is never static.
File operations use a bounded authenticated HomeAssistantView and fetchWithAuth;
small commands and subscriptions use the native HA WebSocket connection.

## Plant-level traits (v0.1.4)

Schema 3 removes retired numeric traits from live varieties and nulls variety links on activity periods. Plant traits and frozen cultivation snapshots are preserved. Legacy import/restore normalizes live masters; old numeric keys remain recognized only to validate historical snapshots and older exchange headers. New snapshots use plant traits across all varieties. Migration is transactional with a pre-migration backup; code-only downgrade to schema-2 releases is refused.

## Shared plant planning (v0.1.11)

Plants may contain optional `seed_state`, `neighbor_good_ids`, `neighbor_bad_ids`, `neighbor_good_names` and `neighbor_bad_names`. These fields are not copied to new plants or cultivation snapshots. SQLite schema 3 and exchange format 1 remain unchanged; the structured CSV reader accepts missing new optional plant columns while continuing to reject unknown/duplicate headers.

`set_neighbors` validates the source revision and writes reciprocal catalog links in one worker transaction. Generic plant updates cannot change neighbor groups; imports validate the complete reciprocal graph before writing, and deletion protects linked plants. Free names have no implied catalog entity. `set_seed_inventory` validates bounded batches of revisions/states before writing in a transaction. The panel splits larger selections into batches of at most 500 plants and preserves unsaved choices on errors. Both operations require the existing shared garden edit permission and emit ordinary garden-change events.

The panel's seed autosave queue coalesces rapid choices, serializes bounded writes and rebases only its own queued revisions on acknowledged writes. Other-user revision conflicts remain explicit. Newer local choices take precedence over in-flight responses. Failed batches stay queued for explicit retry/discard, without background retries. Internal navigation awaits the shared flush promise; authentication/permission changes invalidate the old queue's UI state.

Overview counters use visible destination filters. CSS sticky positioning retains normal page scrolling, with header/summary offsets measured via ResizeObserver to support native host scroll containers and mobile navigation. Calendar quick-filter buttons share the activity selection used by the multi-select dropdown.


## Stock, journal and harvest (v0.1.12)

Schema 4 adds `seed_lots` (plant/optional-variety foreign keys) and `cultivation_journal` (cultivation foreign key), with indexes and an automatic pre-migration backup. Migration 1/2 definitions remain limited to legacy tables so actual schema-3 upgrades do not create duplicate tables. Legacy exchange format 1 imports may omit only the two new tables and optional plant_count column; schema-4 imports must include all nine tables. New records use the existing serialized worker, optimistic revisions, strict validation and shared garden authorization.

Journal kind and parent are immutable. Harvest context is server-managed and captures plant/variety IDs and frozen names plus the currently assigned bed when the entry is created; imports validate parent consistency. Amounts are positive weights precise to one milligram or integer piece counts. In the UI, weights normalize to integer milligrams and never mix with pieces. A plant count is separate from sowing quantity. Each contributing cultivation is counted once per unit/group; an unknown count leaves that per-plant metric unknown. Journal photos use the same validated, bounded local previews as catalog images. Entries do not modify lifecycle status or notification scheduling.


Journal lists in the authorized service omit image payloads by default and return only an `image_present` flag. SQLite removes the image JSON field in the projection before decoding rows. Full `get` and explicit `include_images=true` remain authenticated reads; export/backup use full records without transient flags. A viewport-observed photo component fetches only needed previews and discards stale responses on identity/revision/disconnect changes. Editing retrieves the full current entry. This keeps multiyear photo archives out of routine list refreshes and statistics.


## Bed planning (schema 5)

`bed_layouts` stores one metric polygon/cut-out layout per existing location, protected by a unique index. `bed_plantings` stores plant/variety, optional actual-culture linkage, grid coordinates/count/spacing, inclusive occupancy dates, state and server-managed family snapshot. Foreign keys and bounded polygon validation apply to CRUD and imports. Schema 1–4 tables/migrations remain frozen; schema 5 adds two tables and indexes without modifying existing records. Shared authorization/revisions and worker-thread SQLite transactions remain the same. Plan geometries and history are included in all export/restore paths.

The Lit bed-planner component keeps explicit local drafts and their original revisions, rejects stale saves, guards unsaved navigation and supports pointer or numeric position editing. SVG uses cm viewBox coordinates with even-odd cut-outs; no third-party drawing library or cloud data is involved. Rotation hints use explicit frozen families and whole-bed historical occupancy; absent family data remains unknown. Seed requirements are a transparent count comparison, not automatic inventory allocation.

Planned occupancies use the current explicit plant family and refresh the server-managed snapshot on save. Actual and completed occupancies retain their frozen family across later master-data edits.
