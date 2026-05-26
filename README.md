# vowwch

Zero-dependency runtime contracts for any JavaScript function.

```ts
import { contract } from "vowwch"

const double = contract((n: number) => n * 2, {
  name: "double",
  input: (v: unknown): v is number => typeof v === "number",
  mode: "strict",
})

double(5) // 10
double("bad" as any) // throws VowwchViolationError
```

## Features

- **Zero dependencies** — No transitive supply chain risk. The entire library is pure ECMAScript.
- **Tiny footprint** — 824 B ESM / 905 B CJS gzipped. Fits any edge runtime budget.
- **Predicate-based** — `(value: unknown) => value is T` — no schema DSL to learn. Use plain TypeScript or Zod.
- **Three enforcement modes** — `strict` (throw on violation), `warn` (log + callback), `silent` (zero-cost pass-through).
- **Single-file vendorable** — `curl https://raw.githubusercontent.com/habibthadev/vowwch/main/packages/vowwch/vowwch.ts` into your project and own the source. No registry dependency.
- **Universal runtime** — Works in Node.js, Deno, Bun, Cloudflare Workers, Vercel Edge, and all modern browsers.
- **Dual format** — ESM and CJS with proper `exports` map. No bundler configuration required.
- **Full TypeScript** — Automatic type narrowing from predicates. Complete `.d.ts` types included.

## Install

```bash
npm install vowwch
```

```bash
pnpm add vowwch
```

```bash
yarn add vowwch
```

```bash
bun add vowwch
```

## Quick start

```ts
import { contract, defineGuard, batch, createContractor } from "vowwch"

// 1. Wrap a function with runtime validation
const safeDivide = contract((a: number, b: number) => a / b, {
  name: "safeDivide",
  input: (v: unknown): v is [number, number] =>
    Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number"),
  mode: "strict",
})

// 2. Reuse predicates across contracts
const isPositiveNumber = defineGuard((v: unknown) => {
  if (typeof v !== "number" || v <= 0) throw new Error("Expected positive number")
  return v
})

// 3. Validate every item in an array
const allPositive = batch(isPositiveNumber, { name: "allPositive", mode: "strict" })

// 4. Shared configuration for multiple contracts
const { contract: apiContract } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    console.warn(`[${v.name}] ${v.side} violation:`, v.parserError)
  },
})
```

## Examples

Check the [`examples/`](examples/) directory for runnable demos:

- [Edge runtime](examples/edge-runtime.ts) — batch validation with Cloudflare Workers
- [With Hono](examples/with-hono.ts) — contract enforcement in Hono routes
- [With Prisma](examples/with-prisma.ts) — async contract patterns with Prisma
- [With Zod](examples/with-zod.ts) — using Zod schemas as predicates

## Docs

Full documentation at [vowwch.vercel.app](https://vowwch.vercel.app)

Topics:

- [Installation](https://vowwch.vercel.app/docs/installation)
- [Contract API](https://vowwch.vercel.app/docs/concepts/contract)
- [Vendor model](https://vowwch.vercel.app/docs/concepts/vendor-model)
- [Interior vs boundary](https://vowwch.vercel.app/docs/concepts/interior-boundaries)
- [Edge runtime](https://vowwch.vercel.app/docs/guides/edge-runtime)
- [Guides](https://vowwch.vercel.app/docs/guides)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, project structure, and pull request guidelines.

## License

MIT © [Habibthadev](https://github.com/habibthadev)
