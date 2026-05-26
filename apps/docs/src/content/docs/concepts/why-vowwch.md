---
title: Why vowwch
description: Runtime contracts fill the gap TypeScript leaves behind once types are erased at compile time.
---

## The TypeScript gap

TypeScript's type system is a compile-time fiction. The moment `tsc` finishes, every interface, generic constraint, and union type is stripped away. What remains is plain JavaScript with no memory of the promises your type annotations made.

This erasure is harmless when data flows entirely within your own code. It becomes dangerous at trust boundaries, the seams where your code meets the outside world:

- **API responses** that may return shapes your types no longer describe after a backend deploy
- **Database queries** that produce unexpected nulls when rows are missing or schemas drift
- **User input** that arrives as raw strings regardless of what your form types declare
- **Third-party libraries** that silently change return types across minor version bumps
- **Environment variables** that are always `string | undefined` at runtime, never the enums you typed them as

Most applications validate at the outermost edge and then trust data as it flows inward. That trust is misplaced. The further data travels from its validation point, the more likely it is to have been transformed, merged, or partially overwritten by logic bugs that types cannot prevent.

Consider a function that calculates tax for an e-commerce order. TypeScript guarantees `items` is an array of `OrderItem` at compile time. At runtime, a stale cache, a malformed database join, or a serialization round-trip through JSON could deliver anything: an empty array, an object where you expected an array, items with `price` as a string instead of a number. The TypeScript compiler has no opinion about this because it is no longer running.

## How other tools approach this

Schema validation libraries like Zod and io-ts address the gap by defining runtime-checkable schemas that double as type definitions. You write a schema, infer a type from it, and parse incoming data through it. This is the **parse, don't validate** philosophy: transform unknown data into a known shape, or reject it.

This approach works well at application edges where data arrives as unstructured JSON. It works less well inside your codebase, where functions already have typed signatures and adding a parse step means duplicating type information, introducing allocation overhead, and coupling internal logic to a schema library.

vowwch takes a different approach: **assert, don't parse**. Instead of defining schemas that produce typed outputs, you wrap existing functions with predicate checks. The predicates verify that data satisfies a condition. They do not transform it.

```ts
const isPositiveNumber = (v: unknown): v is number => typeof v === "number" && v > 0

const calculateDiscount = contract((price: number, rate: number) => price * (1 - rate), {
  name: "calculateDiscount",
  input: isPositiveNumber,
  output: isPositiveNumber,
  mode: "warn",
})
```

The function's signature stays the same. The contract wraps it transparently. No schema definition, no type inference from a runtime object, no parse step that allocates a new value.

## The assert vs parse distinction

Parsing produces a new value. When Zod's `.parse()` succeeds, it returns a freshly validated object. This is valuable at system edges where you receive `unknown` data and need to produce typed output. But parsing has a cost: it allocates, it copies, and it requires you to define a schema that mirrors your TypeScript types.

Asserting produces nothing. A predicate checks a condition and returns a boolean. The data passes through unchanged. This is the right tool for interior boundaries where data is already typed and you want to verify an invariant without transforming anything.

vowwch bridges these two worlds with `defineGuard`. If you already have a Zod schema at your edge, you can reuse it as a vowwch predicate:

```ts
import { defineGuard } from "vowwch"
import { z } from "zod"

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
})

const isUser = defineGuard((v) => UserSchema.parse(v))
```

The guard calls the parser internally but presents the result as a boolean predicate. If the parse throws, the guard returns `false` and stores the error on its `_parserError` property. This lets you use rich validation logic from any library without coupling your contracts to that library's API.

## The philosophy

vowwch is built on four principles:

**Minimal.** The entire library is a single TypeScript file with zero dependencies. There is no plugin system, no configuration format, no CLI. The API surface is four functions: `contract`, `defineGuard`, `createContractor`, and `batch`.

**Composable.** Predicates are plain functions. You can combine them with boolean logic, reuse them across contracts, or generate them from any validation library via `defineGuard`. vowwch does not own your validation logic.

**Non-invasive.** Wrapping a function with `contract` does not change its signature, its behavior, or its call sites. You can add contracts incrementally without refactoring.

**Functional.** Contracts are pure wrappers. They do not mutate state, register global handlers, or depend on runtime context. A contracted function is still just a function.

## Where vowwch excels

**Internal function boundaries.** When a service function calls another service function, the calling code might pass data that technically matches the TypeScript type but violates a business invariant. Contracts catch this at the boundary, not three stack frames later when something crashes.

**Monitoring and observability.** In `warn` mode, contracts report violations to your handler without interrupting execution. Pipe violations into your logging infrastructure and you get a continuous audit of data health across your system.

```ts
const contractor = createContractor({
  mode: "warn",
  onViolation: (v) => {
    metrics.increment("vowwch.violation", {
      contract: v.name,
      side: v.side,
    })
    logger.warn("contract violation", {
      contract: v.name,
      side: v.side,
      actual: v.actual,
      timestamp: v.timestamp,
    })
  },
})
```

Every contract created with this contractor feeds violations into your metrics and logging pipeline. You can alert on spikes, track trends, and correlate violations with deploys.

**Gradual adoption.** You can add a contract to a single function in ten seconds. There is no commitment to rewrite your validation layer, adopt a schema library, or restructure your codebase. Start with the function that keeps breaking and expand from there.

## When to use something else

If you need to **transform data** from one shape to another, a schema library like Zod is the right tool. vowwch predicates return booleans, not transformed values.

If you need **schema-first API design** where your runtime schema generates OpenAPI specs, client types, or database migrations, vowwch has no opinion on schemas and cannot help.

If you need **form validation with error messages** mapped to individual fields, use a library designed for that problem. vowwch violations are function-level, not field-level.

vowwch is designed to complement these tools, not replace them. Validate at the edge with Zod. Assert at interior boundaries with vowwch. Both layers serve a purpose.
