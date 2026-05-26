---
title: Introduction
description: vowwch is a zero-dependency TypeScript library for runtime contracts. Validate function inputs and outputs with predicates at every trust boundary in your application.
---

vowwch wraps any JavaScript or TypeScript function with runtime contracts that validate inputs and outputs using predicate functions. It has zero dependencies, ships as a single file, and runs on every JavaScript runtime.

## What is a runtime contract?

A runtime contract is a formal agreement about the data a function accepts and returns. You define predicates that describe valid shapes, and vowwch enforces them every time the function is called. When data violates the contract, vowwch reports the violation with full diagnostic context including the contract name, which side failed, the actual value, the full argument list, a timestamp, and a stack trace.

```ts
import { contract } from "vowwch"

const isPositiveNumber = (v: unknown): v is number => typeof v === "number" && v > 0

const double = contract((n: number) => n * 2, {
  name: "double",
  input: isPositiveNumber,
  output: isPositiveNumber,
  mode: "strict",
})

double(5) // 10
double(-1) // throws VowwchViolationError: input predicate failed
```

When `double(-1)` is called, vowwch runs the `isPositiveNumber` predicate against the first argument. The predicate returns `false`, so vowwch builds a `Violation` with `side: "input"`, `actual: -1`, and `args: [-1]`, then throws because the mode is `strict`.

## Why runtime validation matters

### TypeScript type erasure

TypeScript's type system exists entirely at compile time. Once your code is transpiled to JavaScript, every type annotation, interface, and generic parameter is erased. A function typed as `(id: string) => User` will happily accept a number at runtime if the caller bypasses type checking or the data originates from outside the type-checked boundary.

### Trust boundaries

Any point where data crosses a boundary you do not fully control is a trust boundary. Common trust boundaries include HTTP responses from third-party APIs, rows returned from a database query, values deserialized from localStorage or cookies, messages received over WebSockets or message queues, and configuration loaded from environment variables. At each of these boundaries, the actual shape of the data is unknown until you inspect it at runtime.

vowwch lets you declare exactly what shape you expect and enforces it every time the function runs. When a contract detects a shape mismatch, you learn about it immediately rather than chasing a `cannot read property of undefined` error three call frames later.

## Enforcement modes

vowwch provides three modes that control how violations are handled:

**strict** throws a `VowwchViolationError` immediately when a predicate fails. Use this in development, tests, and any code path where invalid data must halt execution. The error object carries a `violation` property with the full diagnostic payload.

**warn** calls your `onViolation` handler and then returns the function's result as-is. If no handler is provided, violations are logged to `console.error`. Use this in production to observe contract failures without crashing user-facing flows.

**silent** disables all validation. Predicates are never called and no overhead is added. Use this to turn off contracts entirely in performance-critical hot paths or when you need a zero-cost escape hatch.

## Core building blocks

### Guards

`defineGuard()` converts a throwing parser function into a vowwch predicate. If the parser returns successfully, the predicate returns `true`. If the parser throws, the predicate returns `false` and the thrown error message is captured in the violation's `parserError` field.

```ts
import { defineGuard } from "vowwch"
import { z } from "zod"

const UserSchema = z.object({ id: z.string(), name: z.string() })
const isUser = defineGuard((v) => UserSchema.parse(v))
```

This bridges any schema library that uses a parse-or-throw pattern into the predicate model vowwch requires.

### Contractors

`createContractor()` produces a `contract` function that inherits shared defaults for `mode` and `onViolation`. This avoids repeating the same configuration across every contract in a module or application layer.

```ts
import { createContractor } from "vowwch"

const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => metrics.increment(`contract.violation.${v.name}`),
})
```

Every contract created through this contractor uses warn mode and reports violations to your metrics system unless explicitly overridden per-contract.

### Batch processing

`batch()` wraps a function that operates on arrays. The `item` predicate validates each element individually before the wrapped function runs. In warn mode, invalid items are filtered out and violations are reported with an `itemIndex` field identifying which element failed. In strict mode, the first invalid item throws immediately.

```ts
import { batch } from "vowwch"

const isOrder = (v: unknown): v is { id: string; total: number } =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Record<string, unknown>).id === "string" &&
  typeof (v as Record<string, unknown>).total === "number"

const sumOrders = batch(
  (orders: { id: string; total: number }[]) => orders.reduce((sum, o) => sum + o.total, 0),
  { name: "sumOrders", item: isOrder, mode: "warn" },
)
```

## Design principles

**Zero dependencies.** vowwch adds nothing to your dependency tree. There is no transitive supply chain risk and no version conflicts with other packages.

**Single-file vendorable.** The entire library is one TypeScript file. You can curl it into your project and own the source directly, free from npm versioning and registry availability concerns.

**Predicate-based.** Validation logic is a plain function with the signature `(value: unknown) => value is T`. There is no schema DSL to learn, no builder API to memorize. Any function that narrows a type works as a vowwch predicate.

**Functional and composable.** `contract()` takes a function and returns a function with the same signature. Contracts compose with every pattern that works on plain functions: higher-order functions, pipelines, currying, dependency injection.

## When to use vowwch

vowwch is designed for interior boundaries within your application. Use it to validate data flowing between modules, between architectural layers, and around functions that depend on external data having a specific shape. It excels at catching subtle runtime mismatches that slip past compile-time checks.

vowwch is not a replacement for schema validation libraries like Zod, Valibot, or ArkType at your API edges. Those libraries are purpose-built for parsing untrusted external input with detailed, user-facing error messages and data transformation. vowwch does not transform data or produce user-facing errors. It validates contracts between parts of your own system.

Use vowwch when you want a lightweight, zero-overhead mechanism to catch invalid data flowing through internal function boundaries. Use a schema library when you need to parse, transform, and report validation errors to external consumers. The two concerns are complementary: `defineGuard()` lets you plug a schema library's parser directly into a vowwch predicate so both tools work together.

## Next steps

- [Installation](/docs/installation) to add vowwch to your project
- [Quick Start](/docs/quick-start) for a hands-on walkthrough
- [Why vowwch](/docs/concepts/why-vowwch) for the full design philosophy
