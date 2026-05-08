# Contributing

Thanks for taking the time to improve Deferlytics.

Deferlytics is a small TypeScript package for delaying analytics vendors while
preserving explicit analytics calls. Contributions should keep the early browser
path small, avoid surprising vendor behavior, and preserve consent and bot-skip
semantics.

## Development Setup

```bash
npm install
npm run typecheck
npm run test
npm run build
```

Use `npm run prepublishOnly` before changes that affect package output or public
types.

## Project Layout

- `src/`: TypeScript source.
- `tests/`: Vitest coverage.
- `dist/`: generated package output.
- `examples/`: browser and framework usage examples.
- `docs/`: planning and design notes.

## Pull Requests

- Keep changes focused on one behavior or documentation area.
- Add or update tests for runtime behavior changes.
- Update examples and README content when public APIs or configuration change.
- Run `npm run typecheck` and `npm run test` before opening a pull request.
- Mention any intentional behavior changes, browser assumptions, or vendor API
  differences in the pull request description.

Generated files in `dist/` should be updated when the published package output
changes.

## Issues

When reporting a bug, include:

- The Deferlytics version.
- Browser or runtime environment.
- Vendor configuration with sensitive IDs redacted.
- The expected behavior and actual behavior.
- A minimal reproduction when possible.

For feature requests, describe the analytics or performance problem first, then
the API or behavior you would like to see.
