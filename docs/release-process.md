# Release Process

## Current release posture

All public package releases are `beta` for now.

- version bumps are manual
- publishing is automated from Git tags
- stable tags should not be used during Iteration 0
- npm publishes should use the `beta` dist-tag

## Packages covered

The automated publish flow covers the public packages under `packages/`:

- `@reporting/core`
- `@reporting/react-ui`
- `@reporting/mcp-server`
- `@reporting/agent-kit`

## Release steps

1. Update package versions manually.
2. Merge the release-ready changes into `main`.
3. Create and push a release tag in the form `v*`.
4. GitHub Actions publishes the packages to npm using the `beta` dist-tag.

## Notes

- Tag-triggered publishing keeps release control with maintainers.
- Do not publish stable tags from this repo until the beta posture changes.
- Before pushing a tag, run the root `ci` command locally to make sure build and tests pass.
