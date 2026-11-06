# Security policy

No stable version is released yet; no supported production version is claimed.
Do not use this unfinished development version with production data.

Never publish credentials, private configurations, database exports or raw logs.
Use GitHub private vulnerability reporting in this public repository (enabled). If unavailable, open a minimal issue requesting a private
contact channel without disclosing the vulnerability or any sensitive data.

Backend controls now include HA-authenticated and server-authorized writes,
admin-only restore/global settings, bounded validated imports, parameterized SQL,
no runtime cloud/CDN dependency and no credentials in code. These controls have
isolated tests; the frontend also tests escaped text, role-based controls and
user/connection changes. The first public-package HACS/Marketplace installation checks passed; repeat
security and installation review for every future release.

Release review includes dependency and secret scanning. Keep default GitHub
workflow permissions read-only. Never execute untrusted PR code with release
credentials. No production deployment workflow belongs in this repository.

## Home Assistant host versions

Use Home Assistant >=2026.7.0, preferably current stable. Earlier hosts are
vulnerable to CVE-2026-91130 in the native Statistics Graph card. Garden Planner
cannot patch an installed Home Assistant host. The development test extra is
pinned to the patched minimum 2026.7.0 and CI covers the patched minimum/current stable. Published
v0.1.0 artifacts retain their historical metadata; see
[the remediation record](docs/security/CVE-2026-91130.md).
