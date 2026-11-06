# Dependencies and licenses

The integration adds **no separately installed Python runtime dependencies**.
Python standard-library SQLite runs on a dedicated worker. Home Assistant is the
host, not a vendored component. Native frontend/http/websocket_api dependencies
are declared in manifest.json; Lit and fflate are compiled into the bundled UI.

Development tooling: Ruff (MIT) and mypy (MIT), pinned in pyproject.toml. GitHub
Actions: checkout, setup-python, HACS Action and hassfest. Review their current
licenses and transitive dependencies before public release. Workflows pin reviewed upstream commit SHAs (2026-11-06); Dependabot maintains
Action and npm/Python update proposals. GitHub execution evidence is recorded
in the publication report. No skipped HACS checks are configured.

Frontend runtime dependencies are locked in frontend/package-lock.json:
Lit 3.3.3 (BSD-3-Clause), fflate 0.8.3 (MIT), plus their resolved dependencies.
All runtime-tree licenses are BSD-3-Clause or MIT. Complete notices are in
THIRD_PARTY_NOTICES.txt and copied into the integration by the build. The Lit
SSR shim's npm tarball omits a license file; its SPDX/source copyright header and
the Lit distribution's BSD terms are preserved in the notice. No library source
was modified. Development-only TypeScript/Playwright use Apache-2.0, Vite/Vitest/
Prettier/Node types use MIT, and axe tooling uses MPL-2.0; they are not bundled
with the browser application. MIT project licensing does not relicense dependencies.

Dependency versions are exact and npm ci uses the lockfile. npm audit is part of
frontend CI and fails on any reported vulnerability. The first resolved tree had
zero npm advisory findings; audits are time-dependent and must be repeated for
release. Keep the SHA-pinning/security review requirement above before publication.

Jinja2 in the user's private HomeAssistant project is unrelated to this repository
and is not a Garden Planner requirement.

The `ha-test` development extra pins Home Assistant 2026.6.0 in an isolated venv.
It is not a manifest requirement or a dependency to inject into a running HA.
Native HA APIs, voluptuous and the host runtime are supplied by Home Assistant.
The backend itself uses only Python standard-library SQLite, JSON and CSV.
The frontend distribution is self-contained and has no runtime CDN imports.
