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
dates; event instants as UTC with explicit display timezone. Growing windows
use month/day boundaries and handle year wrap and leap years explicitly.

Implemented schema v2: plants, varieties, growing_windows, locations, cultivations,
cultivation_events, tasks, settings and schema_migrations. Operational delivery
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

Target floor: HA 2026.6.0; test baseline plus current stable before release.
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
