---
title: defineGuard()
description: Convert any parser function into a type predicate for use with contract() and batch().
---

`defineGuard()` converts a throwing parser function into a type predicate (`Predicate<T>`) compatible with `contract()` and `batch()`. This bridges schema validation libraries into vowwch without coupling to any specific library.

## Signature

```ts
function defineGuard<T>(parser: (value: unknown) => T): Predicate<T>
```

Where `Predicate<T>` is:

```ts
type Predicate<T> = (value: unknown) => value is T
```

## Parameters

| Parameter | Type                    | Description                                                                                      |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `parser`  | `(value: unknown) => T` | A function that accepts an unknown value and either returns the parsed result or throws an error |

The parser follows the same convention as `.parse()` in Zod, Valibot, and similar libraries: return the validated value on success, throw on failure.

## Return Value

A `Predicate<T>` function that returns `true` when the parser succeeds and `false` when the parser throws.

When the parser throws, the error message is captured and attached to the predicate as a `_parserError` property. This message is propagated into the `parserError` field on any resulting `Violation` object, giving downstream handlers access to the specific validation failure.

## Error Message Propagation

The bridge between parser errors and violations works as follows:

1. The parser throws an error (e.g., a `ZodError`).
2. `defineGuard` catches it and stores the error message on the predicate as `_parserError`.
3. When `contract()` or `batch()` creates a violation, it reads `_parserError` from the predicate and includes it as `violation.parserError`.

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
      console.log(v.parserError) // "Invalid email" (from ZodError)
    },
  },
)

sendEmail("not-an-email")
```

## With Zod

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const User = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
})

const isUser = defineGuard((v) => User.parse(v))

const createUser = contract(
  (data: { id: string; name: string; email: string }) => ({
    ...data,
    createdAt: new Date(),
  }),
  { name: "createUser", input: isUser, mode: "strict" },
)

createUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Alice",
  email: "alice@example.com",
})
```

## With Valibot

```ts
import { defineGuard } from "vowwch"
import * as v from "valibot"

const PositiveInt = v.pipe(v.number(), v.integer(), v.minValue(1))

const isPositiveInt = defineGuard((val) => v.parse(PositiveInt, val))

isPositiveInt(42) // true
isPositiveInt(-1) // false
isPositiveInt(3.14) // false
```

## With ArkType

```ts
import { contract, defineGuard } from "vowwch"
import { type } from "arktype"

const Positive = type("number > 0")

const isPositive = defineGuard((v) => {
  const result = Positive(v)
  if (result instanceof type.errors) throw new Error(result.summary)
  return result
})

const double = contract((n: number) => n * 2, { name: "double", input: isPositive, mode: "strict" })

double(5) // 10
double(-1) // throws VowwchViolationError with parserError: "must be more than 0"
```

## With a Manual Parser

No library needed. Any function that throws on invalid input works:

```ts
import { defineGuard } from "vowwch"

const isNonEmptyString = defineGuard((v) => {
  if (typeof v !== "string") throw new Error("expected string")
  if (v.length === 0) throw new Error("string must not be empty")
  return v
})

const isDateString = defineGuard((v) => {
  if (typeof v !== "string") throw new Error("expected string")
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${v}`)
  return d
})

isNonEmptyString("hello") // true
isNonEmptyString("") // false
isDateString("2025-01-01") // true
isDateString("nope") // false
```

## Composing Guards

Guards are regular predicates, so they compose naturally with contract tuple inputs:

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const isString = defineGuard((v) => z.string().parse(v))
const isNumber = defineGuard((v) => z.number().positive().parse(v))

const repeat = contract((text: string, count: number) => text.repeat(count), {
  name: "repeat",
  input: [isString, isNumber],
  mode: "strict",
})

repeat("ab", 3) // "ababab"
```

## The Assert-vs-Parse Bridge

Traditional type guards use an assert pattern — they inspect a value and return a boolean. Schema libraries use a parse pattern — they transform a value and throw on failure. `defineGuard()` bridges these two worlds:

```ts
// Assert pattern (manual)
const isString = (v: unknown): v is string => typeof v === "string"

// Parse pattern (Zod)
const parseString = (v: unknown) => z.string().parse(v)

// Bridge: parse pattern -> assert pattern
const isStringGuard = defineGuard(parseString)
```

The resulting predicate works anywhere vowwch expects a `Predicate<T>`, in `contract()` input/output options and `batch()` item/output options.

## Gotchas

The parser must **throw** on invalid input. Returning `null`, `undefined`, or `false` does not signal failure — only a thrown error is treated as a validation failure.

The `_parserError` property is overwritten on every failed call. In concurrent code, read it immediately after calling the predicate or rely on `violation.parserError` instead.

The generic type `T` is inferred from the parser return type. If the parser returns a transformed value (e.g., `Date` from a string), the predicate is typed as `Predicate<Date>`, which is correct for output validation but may require type assertions for input validation where the contract expects the original argument type.
