# Garden Planner

[Deutsch](../../README.md)

Local sowing, planting, care and harvest planning for Home Assistant.

**Public development release: [latest release](https://github.com/ClamsyHub/ha-garden-planner/releases/latest).**
[Source](https://github.com/ClamsyHub/ha-garden-planner) is public. Not a stable 1.0
release. Included in the official HACS community catalog since 9 November 2026. [Publication evidence](../publication.md).

## Interface and features

Seven German/English views: overview, year/month/week calendar, plants, current
crops, multi-year history, beds/locations and settings. Responsive light/dark
layouts, keyboard dialogs, multiple seasonal windows and dated cultivation events.
Historical snapshots retain context after master-data edits. Outcomes are explicit
observations. No horticultural recommendations or personal garden data are seeded.

The integration automatically registers its sidebar panel, five count sensors and
a read-only HA calendar of concrete tasks and recorded events. The compiled frontend
ships inside the integration, with third-party notices; no Node.js, additional card,
YAML or extra container is required. Existing HA authentication is used throughout.

## Install from HACS or Marketplace

1. Search for **Garden Planner** in HACS or Home Assistant Marketplace.
2. Open the catalog entry and install the current regular release.
3. Restart Home Assistant.
4. Add Garden Planner in **Settings → Devices & services → Add integration**.
   Its sidebar panel is registered automatically.

The [catalog submission #13526](https://github.com/hacs/default/pull/13526) was
accepted and merged on 9 November 2026. Refresh the store catalog if its local
search has not updated yet. Existing custom-repository installations do not need
reinstallation. Back up HA before updates, then restart HA and reload the panel.

### Fallback: custom repository

If catalog search has not refreshed yet, add `https://github.com/ClamsyHub/ha-garden-planner`
as an **Integration** custom repository in HACS/Marketplace (connect GitHub first
if Marketplace asks). Install the current regular release; pre-releases are not
required. Continue with the restart and integration setup above.

### Isolated manual test installation

Security minimum: HA >=2026.7.0. Copy the complete `custom_components/garden_planner/`
folder including `www/` into an **isolated test instance**, restart HA and add the
integration in Devices & services. One shared garden is supported. No YAML,
additional card, Node.js or extra container is required.
[Test and publication evidence](../catalog/README.md).

## Access, temperatures and reminders

Active HA users can read the shared garden by default. Administrators can restrict
viewing per user; revocation hides the native sidebar link and denies data access.
Re-granting viewing restores links hidden by Garden Planner, preserving links
previously hidden manually and all other sidebar preferences. Administrators
always retain access, including when no other users are selected. Older open
clients may need a reload. Administrators edit and may grant editing
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
No crop-specific care schedule is invented. At most one attempt per destination/task/window/date
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

[Rollen und Benachrichtigungen / Users and notifications](../notifications.md)

From v0.1.4, cultivation traits belong to plants and windows apply to all varieties. Schema-3 migration removes retired variety values after taking a database backup; historical snapshots remain intact. [Migration and rollback](../releases/v0.1.4.md).

From v0.1.5, calendar entries include note tooltips and open compact growing-window details followed by the plant profile. Tap the entry on touchscreens. [Update notes](../releases/v0.1.5.md).

Version 0.1.6 adds calendar multi-filters, sticky year headings/corner and native per-user sidebar visibility. [Update notes](../releases/v0.1.6.md).
