---
title: Violation
description: The Violation interface, VowwchViolationError, and violation handling patterns.
---

When a predicate fails inside `contract()` or `batch()`, a `Violation` object is created. In strict mode, it is wrapped in an error and thrown. In warn mode, it is passed to the `onViolation` handler.

## Violation Interface

```ts
interface Violation {
  name: string
  side: "input" | "output"
  actual: unknown
  args: unknown[]
  timestamp: number
  stack: string | undefined
  parserError?: string
  itemIndex?: number
}
```

| Field         | Type                  | Description                                                                                                      |
| ------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `name`        | `string`              | The `name` from the contract or batch options                                                                    |
| `side`        | `"input" \| "output"` | Whether the violation occurred validating input arguments or the return value                                    |
| `actual`      | `unknown`             | The specific value that failed the predicate                                                                     |
| `args`        | `unknown[]`           | The original arguments passed to the wrapped function                                                            |
| `timestamp`   | `number`              | `Date.now()` at the moment the violation was detected                                                            |
| `stack`       | `string \| undefined` | Stack trace captured at the call site, if available                                                              |
| `parserError` | `string \| undefined` | Present when the predicate was created by `defineGuard()`. Contains the error message from the underlying parser |
| `itemIndex`   | `number \| undefined` | Present in `batch()` violations. The index of the invalid item in the original input array                       |

## When parserError Appears

The `parserError` field is populated only when the failing predicate was created by `defineGuard()`. When a guard's parser throws, the error message is stored on the predicate as `_parserError` and then copied into the violation:

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const isEmail = defineGuard((v) => z.string().email().parse(v))

const sendEmail = contract(
  (to: string) => {
    /* send */
  },
  {
    name: "sendEmail",
    input: isEmail,
    mode: "warn",
    onViolation: (v) => {
      console.log(v.parserError) // "Invalid email" (from Zod)
    },
  },
)

sendEmail("not-an-email")
```

For predicates written by hand (without `defineGuard()`), `parserError` is `undefined`.

## When itemIndex Appears

The `itemIndex` field is present only in violations created by `batch()`. It indicates which element in the input array failed the `item` predicate:

```ts
import { batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const doubleAll = batch((nums: number[]) => nums.map((n) => n * 2), {
  name: "doubleAll",
  item: isPositive,
  mode: "warn",
  onViolation: (v) => {
    console.log(v.itemIndex, v.actual) // 1, -2
  },
})

doubleAll([1, -2, 3])
```

## Violation errors in strict mode

In strict mode, vowwch throws a standard `Error` with a descriptive message and attaches the full `Violation` object as a `violation` property. You access it by catching the error:

```ts
import { contract, type Violation } from "vowwch"

const safe = contract(JSON.parse, {
  name: "safeParse",
  input: (v) => typeof v === "string",
  mode: "strict",
})

try {
  safe(42)
} catch (err) {
  const violation = (err as Error & { violation: Violation }).violation
  console.log(violation.name) // "safeParse"
  console.log(violation.side) // "input"
}
```

## Catching Violations in Strict Mode

```ts
import { contract } from "vowwch"

const isString = (v: unknown): v is string => typeof v === "string"

const greet = contract((name: string) => `hello ${name}`, {
  name: "greet",
  input: isString,
  mode: "strict",
})

try {
  greet(42 as any)
} catch (err) {
  if (err instanceof Error && "violation" in err) {
    const v = (err as Error & { violation: Violation }).violation
    console.log(v.name) // "greet"
    console.log(v.side) // "input"
    console.log(v.actual) // 42
    console.log(v.args) // [42]
    console.log(v.timestamp) // number
    console.log(v.stack) // stack trace string
  }
}
```

## ViolationHandler

```ts
type ViolationHandler = (violation: Violation) => void
```

In warn mode, every violation is passed to the `onViolation` handler. If no handler is provided, `console.error` is called with a formatted message.

## Logging Patterns

### Structured logging

```ts
import { createContractor } from "vowwch"

const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    console.error(
      JSON.stringify({
        type: "vowwch_violation",
        contract: v.name,
        side: v.side,
        actual: v.actual,
        parserError: v.parserError,
        timestamp: v.timestamp,
      }),
    )
  },
})
```

### Sentry integration

```ts
import * as Sentry from "@sentry/node"
import { createContractor } from "vowwch"

const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    Sentry.captureMessage(`[vowwch] ${v.side} violation in "${v.name}"`, {
      level: "warning",
      tags: { contract: v.name, side: v.side },
      extra: { actual: v.actual, args: v.args },
    })
  },
})
```

## Gotchas

The `stack` field may be `undefined` in environments where stack traces are disabled.

The `actual` field contains the raw value that failed validation. For input violations, it is the argument value. For output violations, it is the return value (or the awaited value for async functions).

The `args` field always contains the full argument list, even when only one argument failed. Use it to understand the complete call context.
