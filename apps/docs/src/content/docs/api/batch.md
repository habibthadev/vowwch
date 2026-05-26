---
title: batch()
description: Wrap an array-processing function with per-item input validation and output validation.
---

`batch()` wraps a function that processes an array of items. It validates each item against a predicate before passing the array to the function. In warn mode, invalid items are filtered out. In strict mode, the first invalid item causes an immediate throw.

## Signature

```ts
function batch<TItem, TReturn>(
  fn: (items: TItem[]) => TReturn,
  options: BatchOptions<TItem, TReturn>,
): (items: TItem[]) => TReturn
```

## BatchOptions

```ts
interface BatchOptions<TItem, TReturn> {
  name: string
  item?: Predicate<TItem>
  output?: Predicate<Awaited<TReturn>>
  mode?: Mode
  onViolation?: ViolationHandler
}
```

| Property      | Type                          | Required | Default  | Description                                            |
| ------------- | ----------------------------- | -------- | -------- | ------------------------------------------------------ |
| `name`        | `string`                      | yes      | —        | Identifier included in violation reports               |
| `item`        | `Predicate<TItem>`            | no       | —        | Validates each element in the input array              |
| `output`      | `Predicate<Awaited<TReturn>>` | no       | —        | Validates the return value of `fn`                     |
| `mode`        | `Mode`                        | no       | `"warn"` | Enforcement level: `"strict"`, `"warn"`, or `"silent"` |
| `onViolation` | `ViolationHandler`            | no       | —        | Custom handler called when a violation occurs          |

## Return Value

A function with the same signature as `fn`: it accepts an array and returns whatever `fn` returns. The wrapping behavior depends on the mode.

## Item Predicate vs Output Predicate

`batch()` supports two independent predicates:

- **`item`** validates each element in the input array _before_ calling `fn`. Invalid items are either filtered (warn) or cause a throw (strict).
- **`output`** validates the return value of `fn` _after_ it executes, just like the `output` predicate on `contract()`.

```ts
import { batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const isNumber = (v: unknown): v is number => typeof v === "number"

const sum = batch((nums: number[]) => nums.reduce((a, b) => a + b, 0), {
  name: "sumPositive",
  item: isPositive,
  output: isNumber,
  mode: "warn",
})

sum([1, -2, 3, -4, 5]) // 9 (only 1, 3, 5 passed to fn)
```

## Behavior Per Mode

### warn (default)

Invalid items are removed from the array before passing it to `fn`. A violation is created for each invalid item. The function executes with the filtered array.

```ts
import { batch } from "vowwch"
import type { Violation } from "vowwch"

const violations: Violation[] = []
const isString = (v: unknown): v is string => typeof v === "string"

const toUpper = batch((items: string[]) => items.map((s) => s.toUpperCase()), {
  name: "toUpper",
  item: isString,
  mode: "warn",
  onViolation: (v) => violations.push(v),
})

const result = toUpper(["a", 1, "b", null, "c"] as any)
// result: ["A", "B", "C"]
// violations.length: 2
```

### strict

Throws a `VowwchViolationError` on the first invalid item. The function `fn` is never called.

```ts
import { batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const doubleAll = batch((nums: number[]) => nums.map((n) => n * 2), {
  name: "doubleAll",
  item: isPositive,
  mode: "strict",
})

try {
  doubleAll([1, -2, 3])
} catch (err) {
  const violation = (err as any).violation
  console.log(violation.name) // "doubleAll"
  console.log(violation.side) // "input"
  console.log(violation.actual) // -2
  console.log(violation.itemIndex) // 1
}
```

### silent

Returns the original function with no wrapping. No item or output predicates are evaluated.

```ts
const fn = (nums: number[]) => nums.map((n) => n * 2)
const wrapped = batch(fn, { name: "double", mode: "silent" })

fn === wrapped // true
```

## Data Pipeline Example

```ts
import { batch, defineGuard } from "vowwch"
import { z } from "zod"

const isOrder = defineGuard((v) =>
  z
    .object({
      id: z.string(),
      total: z.number().positive(),
      status: z.enum(["pending", "shipped", "delivered"]),
    })
    .parse(v),
)

const processOrders = batch(
  (orders: Array<{ id: string; total: number; status: string }>) =>
    orders.filter((o) => o.status === "pending").map((o) => ({ ...o, status: "shipped" })),
  {
    name: "processOrders",
    item: isOrder,
    mode: "warn",
    onViolation: (v) => console.error(`Invalid order at index ${v.itemIndex}:`, v.parserError),
  },
)
```

## Use with createContractor

Share a violation handler between `contract()` and `batch()`:

```ts
import { createContractor, batch } from "vowwch"
import type { ViolationHandler } from "vowwch"

const handler: ViolationHandler = (v) => {
  fetch("/api/violations", { method: "POST", body: JSON.stringify({ name: v.name }) })
}

const { contract } = createContractor({ mode: "warn", onViolation: handler })

const isNumber = (v: unknown): v is number => typeof v === "number"

const sumAll = batch((nums: number[]) => nums.reduce((a, b) => a + b, 0), {
  name: "sumAll",
  item: isNumber,
  mode: "warn",
  onViolation: handler,
})
```

## Edge Cases

**No item predicate** — When `item` is omitted, all elements pass through to `fn` without validation.

**Empty array** — An empty array is passed to `fn` as-is. No violations are generated.

**All items invalid in warn mode** — `fn` receives an empty array.

**Output validation** — The `output` predicate validates the return value of `fn`, not individual result elements.

## Gotchas

`batch()` wraps a function that receives the **entire array**, not individual items. The `item` predicate filters before `fn` runs, but `fn` itself operates on the full (filtered) array.

The `itemIndex` field on violations refers to the index in the **original** input array, not the filtered array.
