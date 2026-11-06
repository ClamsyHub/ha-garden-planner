# Publication and release checklist

## Separate approval gates

1. Local development approval does not authorize production deployment.
2. Public repository creation needs explicit owner approval.
3. Every tag/release publication needs explicit approval.
4. Catalog PR submission needs explicit approval.

The development release workflow is read-only, manually dispatched and intentionally
blocked. There is no automatic publish, push or tag action. Later publication
must depend on all required validation, backend, frontend/build, compatibility
and security jobs, with a protected approval environment configured on GitHub.
The frontend bundle/build/browser prerequisites are implemented in phase 4;
native HA setup/restart validation is recorded in docs/validation.md. Published
HACS/Marketplace install/update checks and the publication gate remain outstanding.

## Before public repository creation

- [ ] Confirm CLI account (locally configured: ClamsyHub; API auth unverified).
- [ ] Check repository/domain availability and repository metadata.
- [ ] Review full tracked tree for credentials, private HA files and runtime data.
- [ ] Audit dependency/asset licenses; MIT project license.
- [ ] Enable issues, description and relevant topics.
- [ ] Set branch protection and release environment reviewers on GitHub.

## Before each release

- [ ] Run HACS Action without ignore and Hassfest successfully.
- [ ] Run lint, format and type checks, backend/migration tests and HA matrix.
- [ ] Run frontend tests, TypeScript, browser tests and reproducible bundle build.
- [ ] Test actual install, update, restart and backup/restore in isolated HA.
- [ ] Confirm all runtime assets are inside the integration folder.
- [ ] Include original PNG brand assets and finished de/en translations.
- [ ] Update changelog, compatibility and migration instructions.
- [ ] Match manifest/project version and normalized v-prefixed tag.
- [ ] Review screenshots using neutral example data.
- [ ] Obtain release approval; publish a full GitHub Release, not only a tag.
- [ ] Verify download and installation from the published artifact.

## Before catalog submission

- [ ] Public non-archived repository, metadata and working release.
- [ ] Tested Custom Repository installation in HACS and Marketplace.
- [ ] Passing HACS Action and Hassfest links with no skipped checks.
- [ ] Check current local-brand vs legacy brands requirements.
- [ ] Fork hacs/default and branch from master using the owner's account.
- [ ] Add ClamsyHub/ha-garden-planner alphabetically to integration JSON list.
- [ ] Fill upstream PR template completely and truthfully.
- [ ] Obtain separate submission approval; do not request maintainer reviews.
- [ ] Report membership only after upstream acceptance and catalog processing.

Proposed PR title: **Add ClamsyHub/ha-garden-planner**

Proposed description (replace with verified links before submission):

> Garden Planner is a local sowing, planting and harvest planner with multi-year
> cultivation history. It bundles its frontend with a Home Assistant integration
> and stores user data outside the installation directory. This submission adds
> the repository to the integration catalog. Release, HACS validation, hassfest
> and installation evidence will be linked in the upstream template.

## Official references (reviewed 2026-11-06)

- https://contributors.home-assistant.io/marketplace/guides/integrations/
- https://contributors.home-assistant.io/marketplace/guides/catalog/
- https://contributors.home-assistant.io/marketplace/guides/releases/
- https://contributors.home-assistant.io/marketplace/reference/hacs-json/
- https://contributors.home-assistant.io/marketplace/reference/validation/
- https://www.hacs.dev/docs/publish/integration/
- https://www.hacs.dev/docs/publish/include/
- https://github.com/hacs/default
- https://github.com/home-assistant/brands

Current Marketplace docs accept a local brand folder; older HACS docs still
mention a brands-repository contribution. Check the actual validators at release
time instead of suppressing checks. Planned GitHub URLs may not yet resolve.
