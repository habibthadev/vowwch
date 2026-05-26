---
title: Installation
description: Install vowwch from npm or vendor the single TypeScript file directly into your project. Works with every JavaScript runtime and bundler.
---

## Package manager

::code-group

```bash [npm]
npm install vowwch
```

```bash [pnpm]
pnpm add vowwch
```

```bash [yarn]
yarn add vowwch
```

```bash [bun]
bun add vowwch
```

::

After installing, import any export directly from the package:

```ts
import { contract, defineGuard, batch, createContractor } from "vowwch"
```

## Vendor model

vowwch ships as a single TypeScript file. You can download it directly into your project and bypass the package manager entirely.

```bash
curl -o src/lib/vowwch.ts \
  https://raw.githubusercontent.com/habibthadev/vowwch/main/packages/vowwch/vowwch.ts
```

Then import from the local path:

```ts
import { contract, defineGuard, batch } from "./lib/vowwch"
```

The vendored file contains every export the npm package provides. This approach eliminates supply chain risk, removes version conflicts, and guarantees availability regardless of registry uptime. The file becomes your code to own, audit, and maintain. Pin it to a specific commit hash if you want reproducible builds:

```bash
curl -o src/lib/vowwch.ts \
  https://raw.githubusercontent.com/habibthadev/vowwch/<commit-sha>/packages/vowwch/vowwch.ts
```

When vendoring, keep the file in a dedicated directory like `src/lib/` or `src/vendor/` so it is clearly separated from your application code.

## Requirements

**TypeScript:** 5.0 or later is recommended. vowwch uses standard type narrowing predicates (`value is T`) that work with any TypeScript version supporting user-defined type guards. Strict mode is not required but is strongly recommended.

**JavaScript runtime:** Node.js 18+, Bun, Deno, Cloudflare Workers, Vercel Edge, or any environment that supports ES2022. vowwch uses no Node.js-specific APIs, no filesystem access, and no platform-specific globals.

**Dependencies:** None. The package contains only the compiled library code and TypeScript declaration files. Your lockfile gains exactly one entry.

## TypeScript configuration

vowwch works with any standard `tsconfig.json`. For the best experience, ensure these settings are present:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

If you use `"moduleResolution": "node"` instead of `"bundler"`, package resolution still works because vowwch ships both CJS and ESM builds with proper `exports` field configuration.

If you use `"moduleResolution": "node16"` or `"nodenext"`, ensure your `package.json` sets `"type": "module"` or use the `.mts` extension for files that import vowwch with ESM syntax.

When vendoring the `.ts` file directly, no special module resolution is needed. TypeScript resolves relative `.ts` imports natively in every resolution mode.

## Verify installation

Create a file and run it to confirm everything is wired up:

```ts
import { contract } from "vowwch"

const isString = (v: unknown): v is string => typeof v === "string"

const greet = contract((name: string) => `hello ${name}`, {
  name: "greet",
  input: isString,
  output: isString,
  mode: "strict",
})

console.log(greet("world"))
```

Run the file with your runtime of choice:

::code-group

```bash [Node.js]
npx tsx verify.ts
```

```bash [Bun]
bun verify.ts
```

```bash [Deno]
deno run verify.ts
```

::

The expected output is `hello world`. If you see a module resolution error, check the troubleshooting section below.

## Troubleshooting

### Cannot find module 'vowwch'

This usually means the package is not installed in the correct `node_modules` directory. Run your package manager's install command again and confirm the package appears in your lockfile. If you are using a monorepo with workspaces, ensure vowwch is listed in the `dependencies` of the package that imports it, not only at the workspace root.

### ERR_MODULE_NOT_FOUND or ERR_REQUIRE_ESM

This occurs when the runtime cannot match the import style to the correct build output. If your project uses `"type": "module"` in `package.json`, use `import` syntax. If your project uses CommonJS, use `require`. Mixing the two without a bundler causes this error. Switching `moduleResolution` to `"bundler"` in `tsconfig.json` resolves most cases because it delegates resolution to your build tool.

### Type errors after installation

If TypeScript reports errors on vowwch imports, confirm that your `tsconfig.json` `target` is `ES2022` or later. vowwch's type declarations use `Awaited<T>` for async output validation, which requires TypeScript 4.5+ and a target that includes the `Promise` types. Running `npx tsc --noEmit` in isolation can help narrow whether the error is in your tsconfig or a build tool configuration layer.

### Bundler configuration

vowwch requires no special bundler plugins or configuration. It ships standard ESM and CJS with a `package.json` `exports` map. Webpack, Rollup, Vite, esbuild, and Turbopack all resolve it without additional setup. If you use a custom `resolve.alias` or `externals` configuration, ensure it does not accidentally exclude or redirect the `vowwch` package.
