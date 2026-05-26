# Contributing

Thanks for considering contributing to **vowwch**. This document covers the project setup, structure, development workflow, and release process.

## Table of contents

- [Setup](#setup)
- [Project structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Code style](#code-style)
- [Before submitting a PR](#before-submitting-a-pr)
- [Reporting issues](#reporting-issues)
- [Release](#release)

## Setup

Prerequisites:

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

```bash
git clone https://github.com/habibthadev/vowwch.git
cd vowwch
pnpm install
```

## Project structure

```
vowwch/
├── apps/
│   └── docs/                 # Documentation site (Nuxt 3 + Tailwind v4)
│       └── src/
│           ├── components/    # UI and content components
│           ├── composables/   # Vue composables (search, etc.)
│           ├── content/       # Markdown docs (Nuxt Content v2)
│           └── pages/         # Route pages
├── packages/
│   └── vowwch/                # Library source
│       ├── src/              # TypeScript source
│       │   ├── contract.ts   # contract() — core function wrapper
│       │   ├── contractor.ts # createContractor() — shared config factory
│       │   ├── guard.ts      # defineGuard() — composable predicates
│       │   ├── batch.ts      # batch() — array validation
│       │   └── types.ts      # shared types
│       ├── tests/            # Vitest test suite
│       ├── benchmarks/       # Tinybench benchmarks
│       ├── scripts/          # Build helpers (vendor bundler)
│       └── vowwch.ts          # Vendorable single-file entry
├── examples/                  # Runnable usage examples
│   ├── basic/
│   ├── express-api/
│   └── batch/
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI: typecheck, lint, format, test, size, build
│       └── release.yml       # Release: publish to npm + GitHub Release on push to main
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Development

### Docs dev server

```bash
pnpm dev
```

Starts the Nuxt dev server at `http://localhost:3000`. Content changes hot-reload. Requires the library to be built first.

### Library development

```bash
cd packages/vowwch
pnpm test:watch       # watch mode for Vitest
pnpm build            # rebuild the library with tsup
```

If you're iterating on both the library and docs, rebuild the library after changes:

```bash
pnpm --filter vowwch build    # rebuild library
# then reload the docs browser
```

## Testing

```bash
pnpm test                     # run full test suite
pnpm --filter vowwch test:watch # watch mode
pnpm --filter vowwch bench     # run benchmarks
```

Tests use [Vitest](https://vitest.dev/) with coverage via `@vitest/coverage-v8`. Write tests alongside the source in `packages/vowwch/tests/`.

## Code style

- TypeScript strict mode
- ESLint + Prettier for formatting
- No semicolons (Prettier config)
- 2-space indentation

Format before committing:

```bash
pnpm format
pnpm lint
```

## Before submitting a PR

Run all checks locally. The CI pipeline runs these exact steps:

```bash
pnpm prepublishOnly
```

This runs (in order):

1. `pnpm typecheck` — TypeScript compilation check
2. `pnpm lint` — ESLint across the workspace
3. `pnpm build` — Build the library with tsup
4. `pnpm test` — Run Vitest with coverage
5. `pnpm size` — size-limit verification (ESM: 824 B, CJS: 905 B gzipped)

### Checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes with coverage
- [ ] `pnpm size` passes (under 2 KB)
- [ ] Tests cover the new functionality
- [ ] CHANGELOG.md is updated if the change is user-facing

## Reporting issues

Open an issue at [github.com/habibthadev/vowwch/issues](https://github.com/habibthadev/vowwch/issues). Include:

- A minimal reproduction
- Expected vs actual behavior
- Runtime environment (Node version, browser, edge runtime)

## Release

Releases are fully automated via `.github/workflows/release.yml`:

1. Update `CHANGELOG.md` with the new version entry at the top
2. Push to `main`
3. The workflow extracts the version from the CHANGELOG, checks if it exists on npm, syncs `package.json`, runs quality checks, creates a git tag, publishes to npm, and creates a GitHub Release

No manual tagging or `npm publish` needed. The `prepublishOnly` script is available for local verification but is not used by the automated pipeline.
