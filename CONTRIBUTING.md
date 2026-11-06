# Contributing

Garden Planner is a development preview. Use issues
for reproducible bugs and scoped feature proposals. Include HA and integration
versions, expected/actual behavior and redacted logs. Never attach private HA
configuration or databases.

Use Python >=3.14.2 and a project-local venv. Install `.[dev,ha-test]`, then run
`python scripts/check_repository.py`, `python -m unittest discover -s tests -v`,
`python -m unittest discover -s ha_tests -v`, `ruff check .`, `ruff format --check .` and `mypy` from the repository root.

Add meaningful tests with behavior changes. Keep all runtime files within the
integration package and all runtime user data outside it. Document schema changes,
compatibility limits and restore steps. Keep German and English UI text aligned.
Do not silently infer horticultural facts; source optional examples.

All contributions must be compatible with the MIT project license. New external
or vendored dependencies require a documented license review. Publication and
production deployments are separate owner-approved actions, never test steps.


For frontend changes use the exact npm lockfile and run typecheck, format:check,
Vitest, check:bundle and Playwright from frontend/. Update the compiled bundle
with npm run build intentionally; never edit it by hand. Keep both UI languages
complete, preserve keyboard focus and test narrow/light/dark layouts. The test
bridge is loopback-only with temporary synthetic data, never an auth substitute
or a deployment component. Read docs/frontend.md before starting a preview.
