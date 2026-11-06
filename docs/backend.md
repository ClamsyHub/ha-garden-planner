# Backend contract – phase 5

## Host and storage boundary

The domain package and models are importable without Home Assistant. The HA
adapter loads lazily. One ConfigEntry opens one shared garden under
`hass.config.path("garden_planner")`. Integration unload and HA stop drain the
worker; neither operation deletes user data. SQLite errors during setup become
ConfigEntryNotReady. No productive filesystem or HA instance is used by tests.

SQLite is owned by a dedicated single-thread executor, including connection
creation, transactions, imports, backups and migrations. Cancellation of a
request does not interrupt a partially running transaction. Use the async worker
or service, not Database directly from the event loop.

## Schema version 2 / exchange format version 1

Tables: plants, varieties, growing_windows, locations, cultivations,
cultivation_events and tasks. Each has stable ID, positive revision, UTC audit
timestamps and a validated JSON attributes document. Parent IDs are also separate
SQL foreign-key columns with restrictive deletion; relation/date indexes support
queries. Flexible documents accommodate optional botanical fields without a
large number of nullable SQL columns. Unknown input fields are rejected.

Migration 1 creates tables, settings and migration history; migration 2 adds
indexes. The v1 fixture is a development migration test, not a past public release.
Application ID and user_version distinguish planner files from unrelated/newer
DBs. Page and foreign-key checks precede migration; versioned migrations run in a
transaction with a consistent pre-migration backup. Never use the HA recorder or
input helpers as the source of truth.

Reminder options live in the HA config entry, default off. The legacy
notifications_enabled storage default is unused. Durable delivery reservations
use settings keys prefixed delivery:; no schema migration is needed. Garden
imports/restores do not rewind them or enable notifications.

## Record rules

- Plants/varieties support names, descriptions, sources, care, notes, light,
  water, frost, spacing, seed depth, germination ranges/duration and crop duration.
- Windows have activity, environment, month/day boundaries, optional variety,
  source/regional notes and their own temperature/duration overrides.
- Locations optionally reference a sensor plus explicit measurement kind.
- Cultivations require plant, ISO date and method; variety and bed are optional.
  They preserve a validated snapshot of plant, variety, location and applicable
  growing windows. The snapshot is server-managed and never changed by edits.
- Each cultivation starts with an atomic initial planned/sown event. Edit its
  date/status through the cultivation; the initial event is retained. Later
  events can be entered retrospectively and are sorted by date/audit time/ID.
- `history.sowing_date` is the earliest documented sown event, not a planned date.
  A planned culture with no sowing event has null sowing_date. Year filtering
  uses the observed date where available, otherwise the initial planning date.
- Lifecycle is not a success rating. Overall, germination and harvest results are
  separate explicit observations. Summary does not infer success from completion.
- Parent plant/variety links cannot be reassigned on existing history records.
  A culture may move beds if explicitly linked task locations are first unlinked.
- Optimistic revisions are mandatory for edit/delete. Restore advances revisions
  so forms opened before restoration cannot overwrite the restored records.
- Master-data deletion never cascades into observations. Archive referenced
  plants instead. Explicit confirmed cultivation deletion removes its own
  timeline; linked tasks block it and the entire delete rolls back.

Stable enum values are English API identifiers; German/English UI labels belong
to translations. See models.py for the complete allowed field/enum contract.
No horticultural values, personal region or real sensor IDs are seeded.

## Authenticated WebSocket API

Transport: Home Assistant's existing authenticated connection. Command:

```json
{
  "id": 1,
  "type": "garden_planner/command",
  "operation": "create",
  "parameters": {"table": "plants", "data": {"name": "Example crop"}}
}
```

Identity and roles come exclusively from connection.user, never request data.
All active authenticated users can read this shared garden. Administrators can
write. Administrators can grant editing to other active HA users in the panel
or native options flow. Server-side authorization enforces the current grant set. Import/export, backup/restore and import
previews always require an administrator, even for granted editors.

Operations and required parameters:

| Operation | Parameters |
|---|---|
| get | table, id |
| list | table; optional filters |
| create | table, data |
| update | table, id, data (patch), revision |
| delete | table, id, revision, confirm=true |
| duplicate_plant | id, name; copies plant/general windows, no cultures/varieties |
| history | plant_id |
| summary | none |
| capabilities | none; current edit/admin rights and native host features |
| get_settings | none; admin-only HA options/users/channels |
| set_settings | settings, confirm=true; admin-only |
| reminder_log | none; admin-only latest 200 attempt records |
| export | optional format=json/csv |
| preview_import | payload; optional mode=merge/replace, format=json/csv |
| import | payload, token; same mode/format as preview; confirm=true for replace |
| backup | none; returns server-generated name |
| backups | none; returns managed backup names |
| preview_restore | name |
| restore | name, token, confirm=true |

Filters support applicable parent IDs, cultivation year and master-data archived
flag. No arbitrary SQL, file path or method dispatch is accepted. Stable failures:
invalid_data, not_found, conflict, storage_error and unauthorized. Frontend will
translate these codes rather than show raw internal exception details.

Subscribe with `garden_planner/subscribe`. It returns an HA subscription ID and
sends `{ "changed": true }` after successful mutating commands. Use normal HA
WebSocket unsubscribe. Signals contain no private record bodies. Read/reload is
still authorized separately. The built panel uses authenticated POST /api/garden_planner/exchange for
list/history and export/preview_import/import; other commands use WebSocket.
The HTTP view requires an active native HA user and applies the same service
authorization. Request streaming is bounded to a 41 MiB JSON envelope; the
20 MiB garden-document limit still applies. JSON decoding/encoding uses an executor.
Successful HTTP data responses use Cache-Control: no-store.

## Exchange, backup and restore

JSON exports include format_version, schema_version, exported_at and all tables
with IDs, revisions, timestamps and snapshots. Imports are bounded to 20 MiB and
50,000 records and reject dangling/cross-plant links, invalid values, duplicate IDs
and unsupported format/schema versions.

CSV is a set of seven relational CSV files plus metadata.json, represented as a
filename-to-content mapping. Each cell is JSON-encoded (including strings) to
preserve types, optional vs null fields, multiline Unicode notes and snapshot
objects. Empty cells mean absent fields. This also prevents formula execution
from names/notes. Do not remove the JSON quoting. Very large individual cells may
exceed Python CSV's parser limit; use JSON for those exports. The backend accepts only the exact filename mapping. Phase 4 adds a bounded
frontend ZIP wrapper; arbitrary filenames are rejected before backend import.

preview_import validates without writing and returns counts, conflicts and a
checksum token bound to payload, mode and current database generation. It is a
review/concurrency token, not an authentication credential. Merge inserts new
IDs and skips identical records; differing existing records block the write.
Replace is explicitly destructive, requires confirmation and creates a backup.
All data changes then happen in one transaction. Any failure rolls them back.

Backups are consistent standalone SQLite files created with Connection.backup,
including committed WAL data. They live in the private backups directory. Restore
accepts only existing managed non-symlink filenames; it validates integrity and
relationships. Older supported backups are migrated in a private temporary copy,
leaving the original untouched. Restore preview and execution use the same stable
backup contents. A fresh pre-restore backup is made before replacement. An
unrecognized/newer schema is refused rather than guessed.

Backups are not encrypted and are retained without automatic deletion. Include
the data directory in your own protected external backup strategy and monitor
space. Do not commit these files or assume an integration update is a backup.
Integration removal does not erase the data directory. No deletion-on-uninstall
hook or production deployment exists.
