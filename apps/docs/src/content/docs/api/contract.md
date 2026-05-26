---
title: contract()
description: Wrap any function with runtime input and output validation predicates.
---

`contract()` wraps a function with runtime validation. It checks inputs before calling the original function and checks outputs before returning. The wrapped function preserves the original type signature.

## Signature

```ts
function contract<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: ContractOptions<TArgs, TReturn>,
): (...args: TArgs) => TReturn
```

## ContractOptions

```ts
interface ContractOptions<TArgs extends unknown[], TReturn> {
  name: string
  input?: Predicate<TArgs[0]> | { [K in keyof TArgs]: Predicate<TArgs[K]> }
  output?: Predicate<Awaited<TReturn>>
  mode?: Mode
  onViolation?: ViolationHandler
}
```

| Property      | Type                       | Required | Default  | Description                                                                         |
| ------------- | -------------------------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| `name`        | `string`                   | yes      | —        | Identifier included in violation reports                                            |
| `input`       | `Predicate \| Predicate[]` | no       | —        | Single predicate for the first argument, or a tuple of predicates for each argument |
| `output`      | `Predicate`                | no       | —        | Validates the return value. For async functions, validates the awaited result       |
| `mode`        | `Mode`                     | no       | `"warn"` | Enforcement level: `"strict"`, `"warn"`, or `"silent"`                              |
| `onViolation` | `ViolationHandler`         | no       | —        | Custom handler called when a violation occurs in warn mode                          |

## Return Value

A function with the same signature as `fn`. In silent mode, `contract()` returns the original `fn` reference with zero overhead.

## Behavior Per Mode

**strict** — Throws a `VowwchViolationError` on the first failing predicate. For input violations, `fn` is never called. For output violations, the return value is discarded.

**warn** — Calls `onViolation` (or `console.error` if none is provided) and continues execution. The function runs normally and returns its result regardless of validation failures.

**silent** — Returns the original function unchanged. No predicates are evaluated and no wrapper is created.

## Single vs Tuple Input Predicates

A single predicate validates only the first argument:

```ts
import { contract } from "vowwch"

const isString = (v: unknown): v is string => typeof v === "string"

const greet = contract((name: string) => `hello ${name}`, {
  name: "greet",
  input: isString,
  mode: "strict",
})
```

A tuple of predicates validates each argument by position:

```ts
import { contract } from "vowwch"

const isNumber = (v: unknown): v is number => typeof v === "number"
const isString = (v: unknown): v is string => typeof v === "string"

const repeat = contract((text: string, count: number) => text.repeat(count), {
  name: "repeat",
  input: [isString, isNumber],
  mode: "strict",
})

repeat("ab", 3) // "ababab"
repeat(42 as any, 3) // throws VowwchViolationError
```

## Output Validation

The `output` predicate validates the return value. For async functions, the predicate runs against the resolved value after the Promise settles.

```ts
import { contract } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const divide = contract((a: number, b: number) => a / b, {
  name: "divide",
  output: isPositive,
  mode: "warn",
  onViolation: (v) => console.error(`[${v.name}] bad output: ${v.actual}`),
})

divide(10, 3) // 3.333...
divide(10, -3) // -3.333..., logs violation and returns result
```

## Async Functions

`contract()` detects async functions automatically. Input predicates run synchronously before the call. The output predicate runs after the Promise resolves.

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const isUser = defineGuard((v) => z.object({ id: z.string(), name: z.string() }).parse(v))

const fetchUser = contract(
  async (id: string) => {
    const res = await fetch(`/api/users/${id}`)
    return res.json()
  },
  { name: "fetchUser", output: isUser, mode: "warn" },
)

const user = await fetchUser("abc-123")
```

## Strict Mode Error Handling

In strict mode, catch `VowwchViolationError` to inspect the violation details:

```ts
import { contract } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const double = contract((n: number) => n * 2, { name: "double", input: isPositive, mode: "strict" })

try {
  double(-1)
} catch (err) {
  const violation = (err as any).violation
  console.log(violation.name) // "double"
  console.log(violation.side) // "input"
  console.log(violation.actual) // -1
}
```

## Warn Mode with Custom Handler

```ts
import { contract } from "vowwch"
import type { Violation } from "vowwch"

const violations: Violation[] = []

const abs = contract((n: number) => Math.abs(n), {
  name: "abs",
  input: (v: unknown): v is number => typeof v === "number",
  output: (v: unknown): v is number => typeof v === "number" && v >= 0,
  mode: "warn",
  onViolation: (v) => violations.push(v),
})
```

## Edge Cases

**No predicates** — When neither `input` nor `output` is provided, the function passes through without any wrapping overhead.

```ts
const double = contract((n: number) => n * 2, { name: "double" })

double(5) // 10, no validation performed
```

**Silent mode returns original function** — The returned reference is identical to `fn`, so `===` comparison holds and there is zero runtime cost.

```ts
const fn = (n: number) => n * 2
const wrapped = contract(fn, { name: "double", mode: "silent" })

fn === wrapped // true
```

**Output predicate receives `Awaited<TReturn>`** — When wrapping an async function, the output predicate receives the unwrapped value, not the Promise.

**Violation timestamps** — Each violation includes a `timestamp` (from `Date.now()`) and a `stack` trace captured at the call site.
