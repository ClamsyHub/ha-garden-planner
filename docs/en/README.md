# Garden Planner

[Deutsch](../../README.md)

Local sowing, planting, care and harvest planning for Home Assistant.

**Phase 5: backend, interactive frontend and native HA integration implemented.**
The planned `ClamsyHub/ha-garden-planner` repository has not been publicly created.
No published release or catalog membership exists.

## Interface and features

Seven German/English views: overview, month/week/year calendar, plants, current
crops, multi-year history, beds/locations and settings. Responsive light/dark
layouts, keyboard dialogs, multiple seasonal windows and dated cultivation events.
Historical snapshots retain context after master-data edits. Outcomes are explicit
observations. No horticultural recommendations or personal garden data are seeded.

The integration automatically registers its sidebar panel, five count sensors and
a read-only HA calendar of concrete tasks and recorded events. The compiled frontend
ships inside the integration, with third-party notices; no Node.js, additional card,
YAML or extra container is required. Existing HA authentication is used throughout.

## Isolated test installation

Target HA >=2026.6.0. Copy the complete `custom_components/garden_planner/` folder,
including `www/`, into an **isolated test instance**, restart HA and add Garden
Planner in Settings → Devices & services. One shared garden is supported.

After approved publication, add the public repository as an Integration custom
repository in HACS/Marketplace, install a tested release, restart and add the
integration. Direct catalog search requires an accepted catalog submission.
GitHub publication, custom-repository installation and official catalog membership
are separate milestones. Published install/update validation remains pending.

## Access, temperatures and reminders

Active HA users read the shared garden. Administrators edit and may grant editing
to other active users through the panel or native options flow. Data exchange,
backup/restore, delivery log and global settings remain admin-only.

Locations optionally reference existing temperature sensors and identify air, soil
or germination substrate. °C/°F/K are converted; unavailable/unsupported readings
are identified. Only substrate readings are compared with explicitly recorded
optimal germination ranges. Cultivation comparisons use historical snapshots;
ambiguous matching windows produce no inferred recommendation. Sensors are optional.

Reminders default **off**. Explicit activation requires an existing HA notification
channel, lead time (0–30 days), start hour (HA timezone) and language. The modern
`notify.send_message` service also requires a `notify.*` entity. A 15-minute check
processes stored window openings and open tasks, with up to seven days of catch-up.
No crop-specific care schedule is invented. At most one attempt per task/window/date
is durably reserved before calling the channel. Failed/uncertain attempts are never
automatically retried; this avoids duplicates but may miss a notification. “Sent”
means the HA service call succeeded, not that a device acknowledged delivery.
The UI lists the latest 200 attempts; older reservations remain for deduplication.

## Storage, exchange and backups

SQLite runs on a dedicated worker independently of the recorder. Under Container,
keep `/config` persistent: code belongs to `custom_components/garden_planner/`,
private data to `garden_planner/`. Integration updates/removal do not delete data.
JSON and ZIP-packaged relational CSV preserve IDs, snapshots and relationships.
Reviewed preview tokens and explicit replacement confirmation protect imports and
restore. Revisions prevent silent overwrites from stale forms. Large transfers
use native authenticated HTTP with a bounded envelope; document/uncompressed CSV
limits are 20 MiB and 50,000 records.

Consistent unencrypted local SQLite backups precede replacement/migration and are
not automatically pruned. Keep protected external copies and monitor disk space.
Garden imports/managed restores preserve current delivery reservations and never
activate notifications. HA options/editor grants live in the ConfigEntry and
require a full HA configuration backup as well. Newer/foreign schemas are refused.

## Development and validation

Python >=3.14.2; Node >=22.12 (CI: 24). Root README lists checks. Frontend checks:
npm ci, typecheck, format:check, test, check:bundle and test:e2e. Browser tests use
the actual bundle with real temporary SQLite; the explicit synthetic host fixture
never sends notifications. Native HA tests and a separate official HA Container
exercise host integration. No production files are used.

[Actual screenshots and preview](../frontend.md) · [Backend/API](../backend.md) ·
[Validation and remaining checks](../validation.md) · [Roadmap](../roadmap.md) ·
[Release checklist](../releasing.md) · [Contributing](../../CONTRIBUTING.md)

Project code: [MIT](../../LICENSE). Dependencies retain their
[license notices](../THIRD_PARTY_NOTICES.txt), included with the frontend.
