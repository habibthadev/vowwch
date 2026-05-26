---
title: With Zod
description: Use Zod schemas as vowwch predicates via defineGuard() for schema-driven runtime contracts.
---

Zod's `.parse()` throws on invalid data. `defineGuard()` converts any throwing parser into a vowwch `Predicate`, making Zod schemas work directly as contract validators.

## Object schemas

```ts
import { defineGuard, contract } from "vowwch"
import { z } from "zod"

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
})

type User = z.infer<typeof UserSchema>

const isUser = defineGuard((v) => UserSchema.parse(v))

const fetchUser = contract(
  async (id: string): Promise<User> => {
    const res = await fetch(`/api/users/${id}`)
    return res.json()
  },
  {
    name: "fetchUser",
    output: isUser,
    mode: "strict",
  },
)
```

## Array and union schemas

```ts
import { defineGuard } from "vowwch"
import { z } from "zod"

const TagListSchema = z.array(z.string().min(1).max(50)).min(1).max(20)

const isTagList = defineGuard((v) => TagListSchema.parse(v))

const EventPayloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("scroll"), offset: z.number() }),
  z.object({ type: z.literal("keypress"), key: z.string() }),
])

type EventPayload = z.infer<typeof EventPayloadSchema>

const isEventPayload = defineGuard((v) => EventPayloadSchema.parse(v))
```

## Error message forwarding

When a Zod guard fails, the `ZodError` message is captured in the `parserError` field of the violation. This preserves Zod's detailed validation output.

```ts
import { defineGuard, contract, type Violation } from "vowwch"
import { z } from "zod"

const OrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  currency: z.enum(["USD", "EUR", "GBP"]),
})

const isOrder = defineGuard((v) => OrderSchema.parse(v))

const processOrder = contract(
  (order: z.infer<typeof OrderSchema>) => ({
    id: crypto.randomUUID(),
    ...order,
    total: order.quantity * 9.99,
  }),
  {
    name: "processOrder",
    input: isOrder,
    mode: "warn",
    onViolation: (v: Violation) => {
      console.error(`[${v.name}] ${v.side}: ${v.parserError}`)
    },
  },
)
```

## Reusable guard factory

```ts
import { defineGuard, type Predicate } from "vowwch"
import { type ZodType } from "zod"

function zodGuard<T>(schema: ZodType<T>): Predicate<T> {
  return defineGuard((v) => schema.parse(v))
}
```

Apply it across your codebase:

```ts
import { z } from "zod"

const isEmail = zodGuard(z.string().email())
const isPositiveInt = zodGuard(z.number().int().positive())

const isInvoice = zodGuard(
  z.object({
    id: z.string().uuid(),
    lineItems: z.array(
      z.object({
        sku: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    ),
    total: z.number().nonnegative(),
  }),
)
```

## Refinements and transforms

Zod refinements add custom validation logic. When they fail, `defineGuard` captures the refinement message into `parserError`.

```ts
import { defineGuard, contract } from "vowwch"
import { z } from "zod"

const PasswordSchema = z
  .string()
  .min(8)
  .refine((s) => /[A-Z]/.test(s), "Must contain uppercase letter")
  .refine((s) => /[0-9]/.test(s), "Must contain digit")
  .refine((s) => /[^A-Za-z0-9]/.test(s), "Must contain special character")

const isPassword = defineGuard((v) => PasswordSchema.parse(v))

const DateRangeSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((r) => r.end > r.start, "End date must be after start date")

const isDateRange = defineGuard((v) => DateRangeSchema.parse(v))
```

Zod transforms change the output shape. The guard validates the entire parse chain including the transform.

```ts
const MoneyInputSchema = z
  .object({
    amount: z.string().transform((s) => parseFloat(s)),
    currency: z.enum(["USD", "EUR", "GBP"]),
  })
  .refine((m) => m.amount > 0, "Amount must be positive")

const isMoneyInput = defineGuard((v) => MoneyInputSchema.parse(v))

const TimestampSchema = z
  .string()
  .datetime()
  .transform((s) => new Date(s))
const isTimestamp = defineGuard((v) => TimestampSchema.parse(v))
```

## Combining Zod edges with internal contracts

Use Zod guards at system boundaries where untrusted data enters. For internal contracts between your own modules, plain predicates avoid the overhead of full schema parsing.

```ts
import { defineGuard, createContractor } from "vowwch"
import { z } from "zod"

const WebhookSchema = z.object({
  event: z.enum(["order.created", "order.updated", "order.cancelled"]),
  orderId: z.string().uuid(),
  payload: z.record(z.unknown()),
})

const isWebhook = defineGuard((v) => WebhookSchema.parse(v))

const isNonEmpty = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && Object.keys(v).length > 0

const { contract: apiContract } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    console.error(JSON.stringify({ contract: v.name, side: v.side, parserError: v.parserError }))
  },
})

const handleWebhook = apiContract(
  (event: z.infer<typeof WebhookSchema>) => ({
    processed: true,
    event: event.event,
    orderId: event.orderId,
  }),
  { name: "handleWebhook", input: isWebhook, output: isNonEmpty },
)
```
