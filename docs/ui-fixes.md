# Local UI fixes — 2026-11-06

Changes published in v0.1.1; the v0.1.0 tag and public asset remain unchanged.

- The panel's week view now lists seasonal windows that actually overlap the
  selected Monday–Sunday week, clipped to matching days. Winter/year boundaries
  and discontinuous intersections are handled. Search, category and activity
  filters apply. Concrete tasks and recorded events remain a separate day grid.
- Temperature-sensor suggestions use an in-document accessible combobox instead
  of the browser's native datalist. Search matches name or entity ID. The list
  stays aligned with the field and opens upward when necessary; long lists stay
  within the visible dialog and scroll. Keyboard, Escape, mouse and touch work;
  manual sensor IDs remain supported. Sensor data comes from the current hass.

Validation: 18 unit tests and 54 browser cases passed (desktop/mobile Chromium
and WebKit, zero retries/skips), including 40 sensor options, popup bounds,
keyboard/touch selection, manual entry and axe accessibility. Strict TypeScript,
formatting, exact bundle rebuild and repository validation also passed. Browser
fixtures use temporary SQLite and synthetic records. No schema/backend changes.

The built module is deployed directly to the owner's explicitly authorized local
Docker test instance. Only the module file is replaced; the previous file is
backed up outside the integration. The local HA container is restarted so the
content-hash module URL changes. The browser page must then be reloaded.
