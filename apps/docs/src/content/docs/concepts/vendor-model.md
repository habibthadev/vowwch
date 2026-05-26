---
title: Vendor Model
description: vowwch is designed to be copied into your project as a single file, giving you full ownership with no external dependency.
---

## What vendoring means

Vendoring is the practice of copying a dependency's source code directly into your project instead of installing it through a package manager. The vendored file lives in your repository, ships with your code, and becomes something you own rather than something you depend on.

This is an old practice in systems programming. Go popularized it in the web ecosystem with its `vendor/` directory convention. The idea is simple: if a dependency is small and stable, you eliminate an entire category of risk by owning the source.

## Why vowwch is designed for vendoring

Most libraries are not practical to vendor. They have dozens of files, transitive dependencies, build steps, and internal module resolution that breaks when you move files around.

vowwch is a single TypeScript file with zero dependencies. It exports four functions and a handful of types. There is no build step, no internal module graph, no peer dependency, and no runtime import of anything outside itself. This is intentional. The library was designed from the start to be copied into a project directory and imported as a local module.

The file is published under the MIT license. You can copy it, modify it, redistribute it, or embed it in proprietary software. There is no license compliance burden beyond preserving the copyright notice.

## How to vendor vowwch

Download the file into your project:

```bash
curl -o src/lib/vowwch.ts \
  https://raw.githubusercontent.com/habibthadev/vowwch/main/packages/vowwch/vowwch.ts
```

Or copy it manually from the repository. The file is at `packages/vowwch/vowwch.ts`.

Import from the local path:

```ts
import { contract, defineGuard, createContractor, batch } from "./lib/vowwch"
```

That is the entire setup. No `npm install`, no `package.json` entry, no lockfile update.

## Advantages of vendoring

**No supply chain risk.** The code in your repository is the code that runs. There is no registry lookup at install time, no opportunity for a compromised package to inject itself, no risk from typosquatting or dependency confusion attacks.

**No version conflicts.** When vowwch lives in your source tree, there is no semver range to resolve, no peer dependency to satisfy, no hoisting behavior to debug. The file is pinned by its content, not by a version string.

**No registry dependency.** Your CI pipeline does not need network access to npm, GitHub Packages, or any other registry to build your project. Builds are fully reproducible from the repository alone.

**No lockfile churn.** Adding or updating vowwch does not touch `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`. Your dependency graph stays stable.

**Full auditability.** Every line of code that vowwch executes is visible in your repository. Security audits, code reviews, and compliance checks can examine the vendored file directly.

## When to vendor vs when to use npm

Vendoring is the right choice when:

- Your organization requires audited, pinned dependencies with no transitive risk
- You want to modify vowwch's behavior for your specific use case
- You are working in an environment with restricted or no network access
- You prefer to minimize your `node_modules` surface area

Installing from npm is the right choice when:

- You want automatic updates when new versions are published
- You rely on TypeScript declaration maps and source maps from the package
- Your project already has a mature dependency management workflow
- You want the convenience of `npm update vowwch` over manual file management

Both approaches give you the same library. The choice is about your team's preferences for dependency management, not about functionality.

## Customizing the vendored file

When you vendor vowwch, you own the file. You can modify it to fit your needs:

```ts
export function createViolation(
  name: string,
  side: "input" | "output",
  actual: unknown,
  args: unknown[],
  parserError: string | undefined,
  itemIndex: number | undefined,
): Violation {
  const violation: Violation = {
    name,
    side,
    actual,
    args,
    timestamp: Date.now(),
    stack: new Error().stack,
    correlationId: getRequestContext()?.correlationId,
  }
  return violation
}
```

You might add a `correlationId` from your request context. You might change the default mode. You might strip out `batch` if you never use it. You might add a global violation buffer that flushes to your telemetry service.

These modifications are expected, not discouraged. The vendored file is your code now. You are not forking a library; you are adopting a starting point.

## Comparison to other approaches

**npm/yarn/pnpm install** is the standard approach. It works well when you trust the registry, accept transitive dependencies, and want automated updates. The tradeoff is that your build depends on external infrastructure and your lockfile tracks version resolution you cannot fully control.

**Git submodules** let you pin an entire repository at a specific commit. This is heavier than vendoring a single file. Submodules add complexity to cloning, CI configuration, and developer onboarding. For a single-file library, a submodule is unnecessary overhead.

**Bundled dependencies** (`bundledDependencies` in `package.json`) ship dependencies inside your published package. This solves distribution but not development: your local `node_modules` still resolves through the registry.

**Copy-paste from documentation** is what vendoring formalizes. Instead of copying a snippet and losing track of where it came from, you copy a complete, versioned file with a clear upstream source and a defined process for updates.

## Updating a vendored file

When a new version of vowwch is released, download it and compare:

```bash
curl -o src/lib/vowwch-latest.ts \
  https://raw.githubusercontent.com/habibthadev/vowwch/main/packages/vowwch/vowwch.ts
diff src/lib/vowwch.ts src/lib/vowwch-latest.ts
```

Review the diff. If you have made local modifications, merge them manually. If you have not modified the file, overwrite it. Either way, the update is a deliberate, auditable change in your version control history, not a silent resolution in a lockfile.
