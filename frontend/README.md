# Garden Planner frontend

TypeScript and Lit, built with Vite into the integration's `www/garden-planner.js`.
The build also emits `THIRD_PARTY_NOTICES.txt`. No CDN imports, production tokens,
test actors or test-server code are included. The integration automatically
registers the native HA panel and supplies its normal `hass` property.

## Development and checks

Node >=22.12 (CI: 24), Python >=3.14.2 for the test backend. From this directory:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run format:check
npm test
npm run check:bundle
npx playwright install chromium webkit
npm run test:e2e
```

For intentional source changes, run `npm run build` before `check:bundle` and
commit the resulting bundle and license asset with the source. Do not hand-edit
generated JavaScript. `check:bundle` compares a fresh build byte-for-byte against
both distribution files. `npm run format` updates source formatting only.

Vitest covers calendar dates, leap years, winter/partial-month windows, forms,
ZIP exchange and translated error contracts. Playwright runs the **compiled
bundle**, not a replacement UI, against the real backend with temporary SQLite
files. It checks desktop, mobile and WebKit, including light/dark contrast, focus,
keyboard, import/restore, escaped text, host/user changes and stale async responses.
No test is skipped or retried to hide a failure.

The test suite starts loopback servers on ports 5173 and 8766. Keep them free.
`index.html` and `dev/harness.ts` are preview-only; the test bridge lives in
`../scripts/browser_test_server.py`. It uses synthetic roles and must never be
exposed or deployed as an authentication service. Never use productive records
in the preview. For manual startup, screenshots and user guidance see
[frontend documentation](../docs/frontend.md).

## Dependencies

Exact versions and transitive resolutions are in package-lock.json. Runtime:
Lit (BSD-3-Clause) and fflate (MIT). Full runtime licenses are distributed with
every build. Test/development tools are not browser runtime dependencies. Do not
remove the license-copy build step. See [dependency notes](../docs/dependencies.md).
