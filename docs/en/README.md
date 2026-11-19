# Garden Planner

[Deutsch](../../README.md)

Local garden calendar for sowing, planting, care, fertilizing, pruning and harvest in Home Assistant.

**Public development release: [latest release](https://github.com/ClamsyHub/ha-garden-planner/releases/latest).**
[Source](https://github.com/ClamsyHub/ha-garden-planner) is public. Not a stable 1.0
release. Available in the official HACS community catalog. [Publication evidence](../publication.md).

## Interface and features

Ten German/English views: overview, year/month/week calendar, plants, current
crops, multi-year history, beds/locations, personal generated tasks/reminders, neighbors, seeds/shopping and settings. Responsive light/dark
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

Refresh the store catalog if its local
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

Version 0.1.7 adds a personal task plan from the plant/activity matrix. Read-only users can complete their own work; existing push/email settings notify due tasks. Back up the full HA configuration to retain private choices and completion history. [Update notes](../releases/v0.1.7.md).

Version **0.1.8** makes reminder selections respond immediately and saves rapid changes in batches. The mobile matrix leaves more room for activities, and calendar filters/date navigation are aligned. Filters close on outside clicks or Escape. Wait for the saving indicator before closing the page. [Update notes](../releases/v0.1.8.md).

The **Garden calendar** uses **activity periods** for vegetables, fruit trees and shrubs. **Fertilize** and **Prune** have distinct colors and personal reminder selections. Existing periods remain intact. [v0.1.9 update notes](../releases/v0.1.9.md).

From **v0.1.10**, personal activity tasks display both start and end dates. Notifications remain scheduled from the start date. [Update notes](../releases/v0.1.10.md).

## Neighbors and Seeds & shopping (v0.1.11)

Choose catalog plants as multiple good/bad neighbors. Catalog links are reciprocal and saved atomically; changing the classification updates both sides. Optional free names (one per line) support plants outside the catalog. A unique catalog name entered as text is resolved to that existing plant by the editor; use catalog selection for ambiguous names. Entries without a catalog match remain attached to the selected plant. These are user observations, with no prefilled recommendations. Unlink or archive a linked plant before deleting it.

**Seeds & shopping** is shared garden data. Select one state per plant: Available, Buy, Not needed or Undecided. Changes save automatically in batches, without disabling other choices. Internal navigation waits for pending saves. Wait for the saving indicator to finish before closing the app. Failed choices remain visible for review; explicit retry/discard controls appear only for recovery. Filter Buy to view your shopping choices. After a concurrent edit, unsaved choices remain visible; discard/reload before selecting again. Editors and administrators can change both sections; readers can browse them. Data lives with plants in SQLite and is included in garden JSON/CSV exports and database backups. Legacy CSV files without the optional columns remain supported. Version 0.1.12 uses schema 4; exchange format 1 is unchanged.

Completing shared or personal garden tasks now requires explicit confirmation. Cancel or Escape leaves the task unchanged. Reopen completed work through the task list.

## Overview shortcuts and calendar quick filters

Overview counts open matching plants, planned/active cultures and successful history. Those destination filters can be changed again. Open tasks jumps to upcoming work on narrow displays; wide layouts keep their scroll position if the section is already visible. The summary sticks below navigation as headings scroll away, using compact labels on small screens.

Click one calendar legend activity to select only it, click another to replace it, or click the same activity again to restore all activities. Existing category/search filters are retained. The activity dropdown still supports multiple selections.


## Plant images and updated views

All main sections offer “Back to overview”. Neighbors also appear in a filterable matrix with pinned row and column names. Cells cycle reciprocally between unassigned, good and unfavorable; external names remain editable through “Edit neighbors”.

Choose a JPEG, PNG or WebP up to 12 MiB in a plant or variety form. Only a local PNG preview (up to 512 px and 80 KiB, further reduced as needed) is stored. Originals and metadata are not retained; convert HEIC to JPEG first. Remove images in the same form. Previews are included in garden backups and JSON/CSV exports; the total JSON/CSV import limit remains 20 MiB. Profiles show stored growing facts, germination bounds and activity periods; missing values are never invented.


## Seed stock, journal and harvests (v0.1.12)

In **Seeds & shopping**, click the plant name or **Open stock**. Track separate packets/lots with quantities, units, purchase year, stated viability date, opening date, tested germination percentage and storage location. Lots are ordered by known viability date, then purchase year. Units and shopping status remain independent; adjust remaining quantities manually after use.

In **Current cultivations**, choose **Cultivations & tasks**, **Garden mode** or **Harvest & analysis**. Set the explicit plant count in each cultivation: 20 plants producing 20 kg over several harvests means 1 kg per plant. Sowing quantity is not substituted. Missing counts leave the corresponding per-plant result blank; cultures without harvest records are not assumed to have zero yield.

Garden mode offers photo, observation, harvest and task actions. Camera availability depends on the device/browser; select JPEG/PNG/WebP as an alternative. A small local PNG preview is saved per entry, never the original. Multiple entries provide a photo timeline. Entries also appear in cultivation details and do not advance lifecycle status automatically. Task completion retains its existing confirmation.

Grams and kilograms combine as kilograms; pieces remain separate. Context labels and bed assignment are captured when recording a harvest. The current plant count is included once per contributing culture/unit/group and can affect historical per-plant calculations. Filter and compare by plant, variety, bed, harvest year or cultivation.

Back up the full HA configuration before updating. Schema 4 adds two tables with an automatic pre-migration SQLite backup and preserves existing records/preferences. JSON/CSV exports contain nine data tables including journal images and harvests; old exports remain importable. Total JSON/CSV import limit remains 20 MiB. Downgrading requires a compatible full backup. Restart HA and reload the panel after updating.

## Photos, rescheduling and optional weather hints

Upload a cultivation cover photo through normal **Edit**; dated progress photos remain in the journal. Seed lots expand immediately below their plant row.

Use **Postpone** to change an open shared or personal task's due date. Personal deferrals survive reconciliation without changing the seasonal source or other years. Existing notification settings apply to the effective due date; already delivered messages cannot be withdrawn.

Shared tasks support a daily interval and optional end date. Confirming completion creates exactly one successor from the previous due date. Overdue occurrences are not skipped; undoing/repeating completion does not create duplicates. Postponing beyond the series end stops recurrence.

Administrators may select an existing HA weather entity, forecast horizon and frost threshold. Overview/garden-mode hints consider only active cultivations explicitly marked outdoors and frost-sensitive. Planned, completed and failed cultivations are excluded. Forecasts are cached for 15 minutes; missing/stale data means unknown, not frost-free. Weather hints do not send additional automatic messages. The selected HA weather provider may itself use an external service.

Upload or capture an optional photo directly from **Current cultivations → Add event**. Each event retains its own photo in the timeline. Editing preserves it unless replaced or removed; cultivation covers and journal entries remain independent.


## In development: Bed planner (v0.1.13)

[Usage, backup and limits](../bed-planner.md). Not published yet.
