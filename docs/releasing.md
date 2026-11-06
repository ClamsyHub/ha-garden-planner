# Publication and release checklist

[First publication evidence](publication.md) · [Runtime validation](validation.md)

## Approval boundaries

Public repository creation and v0.1.0 publication were explicitly approved by the
owner. Future releases, productive deployment and catalog PRs need their own
approval. Development approval alone does not authorize those actions.

The manually dispatched `release.yml` calls both complete validation/test workflows.
Only after every mandatory job succeeds does it build the deterministic integration
ZIP and checksum. Publication then waits for approval in the `release` environment,
restricted to main. ClamsyHub is the reviewer; self-review is enabled with explicit
owner approval because this is a single-account project. No PR/push automatically
publishes. Only the publish job receives contents:write. Action refs are SHA-pinned.
Existing tags must point directly at the exact tested commit; releases/tags are
never overwritten. The workflow defaults to **pre-release**. A regular release requires the explicit
`release` channel choice and owner approval; every validation/environment gate
remains in force.

The local `--release` check verifies structural/package readiness. It cannot prove
remote CI, authorization or real installation; those are separate workflow and
owner gates. Build locally with:

```sh
python scripts/check_repository.py --release --tag v0.1.0
python -m scripts.build_release --tag v0.1.0 --output /tmp/garden_planner.zip
```

## Before each release

- [x] Initial public repository, account, issues, description and topics verified.
- [x] Initial source/artifact privacy review and original MIT artwork/license notices.
- [x] HACS Action without ignored checks and Hassfest passed for v0.1.0.
- [x] Backend, HA matrix, frontend, browser, lint/types/build and npm audit passed.
- [x] Initial HACS/Marketplace public-asset installation and restart tested.
- [x] Published ZIP contains compiled frontend, translations, brands and license.
- [ ] Repeat all checks against the exact **next** release commit.
- [ ] Test next-version upgrade, restart, backup/restore and migration instructions.
- [ ] Update manifest/project/frontend versions, changelog and versioned notes together.
- [ ] Review current dependencies, Action pins, assets and validator requirements.
- [ ] Obtain approval for that release and dispatch the workflow on main.
- [ ] Approve the tested deployment; verify published download/checksum/install.

Do not overwrite published tags/assets to fix a release. Prepare a new version and
obtain release approval. The first public version has no earlier public upgrade
baseline; its actual store replacement test is documented in the publication report.

## Before catalog submission — phase 7

Current preparation: [catalog readiness](catalog/README.md). No submission or
maintainer acceptance is claimed.

- [ ] Recheck current catalog rules, repository metadata and acceptable release status.
- [ ] Attach real release, HACS Action, Hassfest and Custom Repository install evidence.
- [ ] Check current local-brand vs legacy brands requirements without ignoring checks.
- [ ] Prepare the upstream integration-list change and fill its PR template truthfully.
- [ ] Obtain explicit PR submission approval; do not request maintainer reviews.
- [ ] Report membership only after maintainer acceptance and catalog processing.

Proposed title: **Add ClamsyHub/ha-garden-planner**

Proposed English description (adapt to the current upstream template):

> Garden Planner is a local sowing, planting and harvest planner with multi-year
> cultivation history. Its frontend ships with the integration and its SQLite
> user data stays outside the replaceable component directory. The repository
> has a public development release and passing HACS Action/Hassfest validations.
> Custom Repository installation was tested with HACS and the native Marketplace.
> See docs/publication.md for exact validation and installation evidence.

The first development release is not a claim of catalog eligibility or acceptance.
Review release maturity requirements before submitting.

## Official references — reviewed 2026-11-06

- https://contributors.home-assistant.io/marketplace/guides/integrations/
- https://contributors.home-assistant.io/marketplace/guides/catalog/
- https://contributors.home-assistant.io/marketplace/guides/releases/
- https://contributors.home-assistant.io/marketplace/reference/hacs-json/
- https://contributors.home-assistant.io/marketplace/reference/validation/
- https://www.hacs.dev/docs/publish/integration/
- https://www.hacs.dev/docs/publish/include/
- https://github.com/hacs/default
- https://github.com/home-assistant/brands

Current Marketplace docs/validators accept a local brand folder. Legacy HACS docs
still mention the brands repository; validate current requirements rather than
suppressing checks or opening an unnecessary upstream PR.
