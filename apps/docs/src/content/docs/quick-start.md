---
title: Quick Start
description: Build your first runtime contracts in under five minutes. Learn predicates, modes, guards, contractors, and batch processing.
---

## Create a predicate

A predicate has the signature `(value: unknown) => value is T`. It must return `false` for invalid data, never throw.

```ts
const isString = (v: unknown): v is string => typeof v === "string"

const isPositiveNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0

const isUser = (v: unknown): v is { id: string; email: string } => {
  if (typeof v !== "object" || v === null) return false
  const obj = v as Record<string, unknown>
  return typeof obj.id === "string" && typeof obj.email === "string"
}
```

## Wrap a function with contract()

`contract()` returns a function with the same signature that validates on every call. The `input` field accepts a single predicate or a tuple matched by position. For async functions, the `output` predicate validates the awaited result.

```ts
import { contract } from "vowwch"
const createUser = contract((id: string, email: string) => ({ id, email }), {
  name: "createUser",
  input: [isString, isString],
  output: isUser,
  mode: "strict",
})
createUser("u_1", "alice@example.com") // { id: "u_1", email: "alice@example.com" }
```

## Handle violations in strict mode

A failed predicate throws a `VowwchViolationError` with a `violation` property containing the contract name, which side failed, the actual value, and a stack trace.

```ts
const parseAge = contract((v: string) => Number(v), {
  name: "parseAge",
  output: isPositiveNumber,
  mode: "strict",
})
try {
  parseAge("not-a-number")
} catch (err) {
  const { violation } = err as Error & { violation: import("vowwch").Violation }
  console.log(violation.name) // "parseAge"
  console.log(violation.side) // "output"
  console.log(violation.actual) // NaN
  console.log(violation.args) // ["not-a-number"]
}
```

## Handle violations in warn mode

The function returns its result and violations go to `onViolation`. Without a callback, vowwch logs to `console.error`.

```ts
const lookupUser = contract(
  async (id: string) => {
    const res = await fetch(`/api/users/${id}`)
    return res.json()
  },
  {
    name: "lookupUser",
    output: isUser,
    mode: "warn",
    onViolation: (v) => console.error(`${v.name}: ${v.side} violation`, v.actual),
  },
)
const data = await lookupUser("u_1")
```

## Use defineGuard() with Zod

`defineGuard()` converts a parse-or-throw function into a predicate. When the parser throws, the error message is captured in the violation's `parserError` field.

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"
const InvoiceSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP"]),
})
type Invoice = z.infer<typeof InvoiceSchema>
const isInvoice = defineGuard((v) => InvoiceSchema.parse(v))
const processInvoice = contract((invoice: Invoice) => ({ processed: true, id: invoice.id }), {
  name: "processInvoice",
  input: isInvoice,
  mode: "strict",
})
processInvoice({ id: "550e8400-e29b-41d4-a716-446655440000", amount: 99.99, currency: "USD" })
processInvoice({ id: "bad", amount: -5, currency: "FAKE" })
// throws VowwchViolationError with parserError from Zod
```

## Use createContractor() for shared config

`createContractor()` produces a `contract` function with shared defaults, eliminating repetition.

```ts
import { createContractor } from "vowwch"
const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => logger.error("contract violation", { contract: v.name, side: v.side }),
})
const getPrice = contract((sku: string) => catalog.lookup(sku)?.price ?? 0, {
  name: "getPrice",
  input: isString,
  output: isPositiveNumber,
})
const getStock = contract((sku: string) => inventory.count(sku), {
  name: "getStock",
  input: isString,
  output: isPositiveNumber,
})
```

## Use batch() for array processing

`batch()` wraps functions that operate on arrays. The `item` predicate validates each element. In warn mode, invalid items are filtered out before the function runs. Each violation includes an `itemIndex`.

```ts
import { batch } from "vowwch"
const isTransaction = (v: unknown): v is { id: string; amount: number } => {
  if (typeof v !== "object" || v === null) return false
  const obj = v as Record<string, unknown>
  return typeof obj.id === "string" && typeof obj.amount === "number"
}
const settle = batch(
  (txns: { id: string; amount: number }[]) => txns.map((t) => ({ ...t, settled: true })),
  { name: "settle", item: isTransaction, mode: "warn" },
)
settle([
  { id: "tx_1", amount: 100 },
  { id: "tx_2", amount: "bad" as unknown as number },
  { id: "tx_3", amount: 50 },
])
// processes tx_1 and tx_3; reports violation for index 1
```

## Common patterns

Wrap API client functions so every response is validated before reaching business logic:

```ts
const fetchOrder = contract(
  async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`)
    return res.json()
  },
  { name: "fetchOrder", output: isOrder, mode: "warn" },
)
```

Validate database rows before downstream transformations:

```ts
const getUserById = contract(
  async (id: string) => {
    const row = await db.query("SELECT id, email FROM users WHERE id = $1", [id])
    return row[0] ?? null
  },
  {
    name: "getUserById",
    output: (v: unknown): v is { id: string; email: string } | null => v === null || isUser(v),
    mode: "strict",
  },
)
```

## Next steps

- [contract()](/docs/api/contract) API reference
- [Modes](/docs/api/mode) for understanding enforcement levels
- [Interior Boundaries](/docs/concepts/interior-boundaries) for the design pattern vowwch enables
