# Build security review: GHSA-fc5q-39xc-vjpf

Checked on **2026-11-18** for v0.1.12.

## Current status

GitHub withdrew [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) at **2026-11-18 15:38:56 UTC**. A fresh full `npm audit --audit-level=low` completed successfully with zero vulnerabilities. The official latest picomatch remains 4.0.7; no dependency patch, audit exclusion, changed threshold or status-check bypass was introduced. Withdrawal is an advisory-status change, not a claim that package code was patched.

## Historical blocker

Earlier v0.1.12 candidate runs failed their unchanged frontend audit while the advisory was active. Paths were Vite/Vitest → picomatch and Vite/Vitest → tinyglobby → fdir/picomatch. These are development/build dependencies; npm/node_modules and picomatch are not shipped in the Home Assistant ZIP. The failed runs remain part of the review history.

The release must still pass every normal repository, HACS, Hassfest, backend, native Home Assistant and frontend check, including the full audit and reproducible build. The owner explicitly approved publication of v0.1.12.
