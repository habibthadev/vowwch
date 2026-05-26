---
title: Mode
description: The three enforcement modes that control how vowwch reacts to contract violations.
---

Every contract and batch has a mode that determines what happens when a predicate fails. The default mode is `"warn"`.

```ts
type Mode = "strict" | "warn" | "silent"
```

## strict

Throws a `VowwchViolationError` immediately when a predicate fails.

For input violations, the wrapped function is never called. For output violations, the return value is discarded. This makes strict mode a hard gate: invalid data never passes through.

```ts
import { contract } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const double = contract((n: number) => n * 2, { name: "double", input: isPositive, mode: "strict" })

double(5) // 10
double(-1) // throws VowwchViolationError
```

In `batch()`, strict mode throws on the first invalid item. The batch function never executes:

```ts
import { batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const sum = batch((nums: number[]) => nums.reduce((a, b) => a + b, 0), {
  name: "sum",
  item: isPositive,
  mode: "strict",
})

sum([1, -2, 3]) // throws VowwchViolationError (itemIndex: 1)
```

**When to use:** Development, testing, and CI pipelines.

## warn

Calls the `onViolation` handler and continues execution. If no handler is provided, `console.error` is called. The function runs normally regardless of validation failures.

```ts
import { contract } from "vowwch"
import type { Violation } from "vowwch"

const violations: Violation[] = []

const double = contract((n: number) => n * 2, {
  name: "double",
  input: (v: unknown): v is number => typeof v === "number" && v > 0,
  mode: "warn",
  onViolation: (v) => violations.push(v),
})

double(-1) // -2 (function still runs)
console.log(violations.length) // 1
```

In `batch()`, warn mode filters invalid items out of the array. Only valid items are passed to the function:

```ts
import { batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const sum = batch((nums: number[]) => nums.reduce((a, b) => a + b, 0), {
  name: "sum",
  item: isPositive,
  mode: "warn",
})

sum([1, -2, 3, -4, 5]) // 9 (only 1, 3, 5 reach the function)
```

**When to use:** Production monitoring and staging environments.

## silent

Skips all validation entirely. No predicates are evaluated. No violations are created. `contract()` and `batch()` return the **original function reference** with zero overhead.

```ts
import { contract } from "vowwch"

const fn = (n: number) => n * 2

const double = contract(fn, {
  name: "double",
  input: (v: unknown): v is number => typeof v === "number" && v > 0,
  mode: "silent",
})

fn === double // true (same reference)
double(-1) // -2 (no validation, no wrapper)
```

Because the original function is returned directly, there is no performance cost. The predicate functions are never called.

**When to use:** Performance-critical hot paths or as a kill-switch to disable all validation.

## The Default Mode

When `mode` is omitted, it defaults to `"warn"`. Violations are reported but execution continues.

```ts
import { contract } from "vowwch"

const double = contract((n: number) => n * 2, {
  name: "double",
  input: (v: unknown): v is number => typeof v === "number",
})
// mode defaults to "warn"
```

## Performance Implications

| Mode     | Predicate Evaluation | Wrapper Overhead           | Violation Cost |
| -------- | -------------------- | -------------------------- | -------------- |
| `strict` | Every call           | Minimal wrapper            | Throws error   |
| `warn`   | Every call           | Minimal wrapper            | Handler call   |
| `silent` | Never                | None (returns original fn) | None           |

The difference between strict/warn and silent is structural: strict and warn create a wrapper function. Silent returns the original function with zero runtime cost.

## Switching Modes Per Environment

Use `createContractor()` to set the mode at startup:

```ts
import { createContractor } from "vowwch"

const mode =
  process.env.NODE_ENV === "production"
    ? "silent"
    : process.env.NODE_ENV === "test"
      ? "strict"
      : "warn"

const { contract } = createContractor({ mode })
```

Individual contracts can override the inherited mode:

```ts
const isString = (v: unknown): v is string => typeof v === "string"
const parseInput = contract((raw: string) => JSON.parse(raw), {
  name: "parseInput",
  input: isString,
})
const criticalParse = contract((raw: string) => JSON.parse(raw), {
  name: "criticalParse",
  input: isString,
  mode: "strict",
})
```

## Choosing a Mode

| Environment             | Recommended Mode | Reason                                        |
| ----------------------- | ---------------- | --------------------------------------------- |
| Development             | `strict`         | Fail fast on bad data during coding           |
| Unit tests              | `strict`         | Surface violations as test failures           |
| Integration tests       | `warn`           | Collect violations without blocking test runs |
| Staging                 | `warn`           | Monitor violations against real-world data    |
| Production (observable) | `warn`           | Log violations to Sentry, Datadog, etc.       |
| Production (hot path)   | `silent`         | Zero overhead on performance-critical code    |

## Combining with createContractor

Create separate contractors for different enforcement levels:

```ts
import { createContractor } from "vowwch"

const { contract: tracked } = createContractor({ mode: "warn" })
const { contract: critical } = createContractor({ mode: "strict" })
```

Use `tracked` for most contracts and `critical` for contracts that must never allow invalid data through.

## Gotchas

There is no runtime validation that the `mode` string is valid. Passing an invalid string results in undefined behavior.

Switching from `"silent"` to another mode requires recreating the contracts because silent mode returns the original function reference.
