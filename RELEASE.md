# Release Process

This repository uses GitHub Actions for npm Trusted Publishing.

## 0.2.0

- Added support for multiple GA4 measurement IDs through `measurementIds`.
- Added support for multiple Yandex Metrica counters through `counterIds`.
- Kept existing single-value `measurementId` and `counterId` configs backward-compatible.

Workflow:

```txt
.github/workflows/publish.yml
```

## First Publish

The first `0.1.0` publish must be done manually because npm trusted publisher settings are configured for an existing package.

```bash
npm login
npm run prepublishOnly
npm publish --access public
```

## Configure npm Trusted Publisher

After the package exists on npm, open the package settings on npmjs.com and add a trusted publisher:

```txt
Publisher: GitHub Actions
Organization or user: CeleRn
Repository: deferlytics
Workflow filename: publish.yml
```

Trusted Publishing uses GitHub Actions OIDC, so release builds do not need a long-lived `NPM_TOKEN`.

## Future Releases

Publish future releases by creating and pushing a version tag:

```bash
npm version patch
git push origin main
git push origin v0.1.1
```

The workflow runs on `v*` tags and can also be started manually from the GitHub Actions tab.

## Release Checks

The workflow runs:

```bash
npm ci
npm audit --audit-level=moderate
npm publish --access public
```

`npm publish` runs `prepublishOnly`, which performs:

```bash
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```
