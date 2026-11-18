# Build security blocker: GHSA-fc5q-39xc-vjpf

Checked on **2026-11-18** for the v0.1.12 development candidate.

The unchanged GitHub `frontend` job fails at `npm audit --audit-level=low` for [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). The advisory affects picomatch through 4.0.7 and lists no patched version. At verification time, `npm view picomatch version` and its dist-tags both identify 4.0.7 as the latest release. Upstream has proposed open fixes, but no reviewed released replacement is available.

Dependency paths in this project are Vite/Vitest → picomatch and Vite/Vitest → tinyglobby → fdir/picomatch. These are development/build dependencies. The Home Assistant ZIP contains the Python integration, the compiled Lit/fflate frontend, brand assets and licenses; it does not ship npm/node_modules or run picomatch. This does not make the audit pass, and the finding remains open.

No audit exclusions, weakened thresholds, unreviewed forks, forced dependency downgrades or changes to required status checks have been introduced. Six other required GitHub checks passed on candidate `44e4c9f955361fd61a45fad749d7005094ed2260`: repository, hassfest, hacs, backend and native tests for HA 2026.7 / 2026.11+. The frontend job remains failed/blocking because audit runs before its other stages. Local functional tests are reported separately and must never be represented as a successful GitHub security check.

Before publication:

1. Recheck the authoritative advisory and official npm releases for a corrected version.
2. Upgrade the affected dependency chain using compatible reviewed releases; refresh the lockfile and license notices if needed.
3. Require a clean, unchanged npm audit, type/lint/unit/browser/native checks and reproducible build.
4. Build and verify a new candidate; update the Mac test installation if runtime bytes change.
5. Follow the normal explicit release-approval process. No release has been published for v0.1.12.

This note records a point-in-time blocker, not permission to bypass release checks.
