# Validation report — phase 5

Date: 2026-11-06. Synthetic records and temporary directories only. No productive
HA configuration, Synology mount, private database or GitHub repository was changed.

| Check | Result |
|---|---|
| Backend / repository / authorization tests | 44 passed |
| Native HA 2026.6.0 adapter / feature tests | 19 passed |
| Native HA 2026.11.0 adapter / feature tests | 19 passed |
| Frontend date/form/archive/temperature unit tests | 16 passed |
| Desktop Chromium / mobile Chromium / WebKit | 16 cases each |
| Total browser cases | 48 passed, no skips or retries |
| Strict TypeScript and Prettier | Passed |
| Production bundle and exact rebuild comparison | Passed |
| Ruff lint / formatting and strict mypy against HA types | Passed |
| Repository metadata / JSON / Python and workflow YAML | Passed |
| npm advisory audit of resolved dependencies | Zero findings at check time |
| Official HA Container 2026.6.0 full setup | Passed |
| Same Container after final code replacement and restart | Passed; records preserved |

## What was exercised

Backend tests use real on-disk SQLite connections, worker threads and transactions.
Coverage includes multi-year sowings, immutable snapshots, retrospective events,
optimistic conflicts, archived records, reference validation and deletion rollback,
JSON/CSV round trips, import previews/conflicts, transactional rollback, WAL backups,
restore revisions, migrations and refusal of foreign/future schemas. Notification
reservations survive restart and garden replacement; imports never activate sending.

HA tests instantiate actual HomeAssistant, initialized ConfigEntries, native users,
ActiveConnection/WebSocket dispatch and the real HTTP application. They exercise
config/options flows, setup/unload, automatic panel/static registration, file
transport authorization, a streamed payload above HA's ordinary 16 MiB read limit,
admin-only configuration, granted editor CRUD, sensors/calendar, notifications off
by default, persistent attempt deduplication, uncertain failures and winter/leap
window boundaries. Expected notification failures are explicitly asserted.
ResourceWarning is promoted to an error. The adapter fixtures mock platform
forward/unload calls; complete native platform loading is covered by Container.
HTTP fixture identity injection tests the view, while Container tests real HA auth.

Browser tests load the **actual distribution JavaScript** against PlannerService
and temporary SQLite via a loopback-only development bridge. They exercise all
seven views, CRUD, winter bars, multiple sowing years, historical snapshots,
JSON/CSV import/export/restore, confirmed deletion, preserved drafts, keyboard and
focus behavior, both themes, filtering, escaping, cache clearing on user changes
and stale async results. Axe checks light/dark views and forms without disabling
rules. The date-pair layout is verified geometrically on wide displays and checked
for mobile overflow. Explicit reminder/editor settings use a synthetic host fixture;
that fixture does not send notifications or replace the native HA tests.

## Actual isolated Container check

A new `ghcr.io/home-assistant/home-assistant:2026.6.0` Container was created with
only temporary `/config`, Europe/Berlin and a port bound to `127.0.0.1`. No host
network, productive mounts or existing containers were used. A disposable owner
was onboarded through HA, then native REST config flow and authenticated network
WebSocket commands configured Garden Planner. Verified:

- Loaded config entry, automatic native sidebar panel and public static code.
- Five real count sensor entities and one real calendar entity.
- A synthetic plant/cultivation, reminders disabled and authenticated HTTP export.
- Anonymous export rejected by HA authentication.
- Final component files copied to the isolated instance, Container restarted,
  existing configuration and the same garden records still available.

Disposable credentials were kept outside the source tree. The test Container is
removed after validation. The expected HA custom-integration warning is not
suppressed; HA does not certify this component. Upstream image startup messages
are distinct from integration errors. This is a direct custom-component test,
not evidence of a published HACS/Marketplace installation or an actual mobile app.

## Reproduce source checks

From repository root in isolated Python >=3.14.2 environments:

```sh
python scripts/check_repository.py
python -B -W error::ResourceWarning -m unittest discover -s tests -v
python -B -W error::ResourceWarning -m unittest discover -s ha_tests -v
ruff check .
ruff format --check .
mypy
```

Run HA tests separately with HA 2026.6.0 and current stable. The scheduled CI matrix
keeps the floor pinned and the current stable package unpinned intentionally.
From `frontend/`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run format:check
npm test
npm run check:bundle
npx playwright install chromium webkit
npm run test:e2e
```

The suite starts loopback-only servers on 5173/8766. Screenshots in
[frontend documentation](frontend.md) contain synthetic data. Rebuild comparison
also covers runtime license notices. A repository guard rejects test transport
and actor markers in the shipped bundle.

## Outstanding release requirements

- Explicit public repository and release approval; metadata/account availability review.
- Successful real GitHub HACS Action and Hassfest, with no ignored checks.
- Original brand assets and current validator/category requirements.
- Final dependency/security review, reviewed Action SHA pins and branch protection.
- Actual published release installation/update/download in HACS and Marketplace.
- Physical-device/Companion App checks; full HA frontend navigation in supported clients.
- Catalog PR approval, submission and maintainer acceptance (separate milestone).

The release-readiness command remains intentionally blocked. Passing phase 5
does not authorize publication or production installation. No release, public
repository or catalog membership is claimed.
