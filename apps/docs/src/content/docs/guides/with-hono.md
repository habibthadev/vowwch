---
title: With Hono
description: Add runtime contracts to Hono HTTP handlers for request and response validation.
---

Hono is a lightweight web framework that runs everywhere. vowwch contracts wrap route handlers to validate parsed request data and response shapes at runtime.

## Contracted route handler

```ts
import { Hono } from "hono"
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const app = new Hono()

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
})

type CreateUserInput = z.infer<typeof CreateUserSchema>

const isCreateUserInput = defineGuard((v) => CreateUserSchema.parse(v))

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const createUser = contract(
  (input: CreateUserInput) => ({
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  }),
  {
    name: "POST /users",
    input: isCreateUserInput,
    output: isObject,
    mode: "strict",
  },
)

app.post("/users", async (c) => {
  const body = await c.req.json()
  const user = createUser(body)
  return c.json(user, 201)
})

export default app
```

## Request validation middleware

Extract contract-based validation into reusable middleware that runs before the handler.

```ts
import { Hono } from "hono"
import { contract, defineGuard, type Predicate } from "vowwch"
import { z } from "zod"
import type { Context, Next } from "hono"

function validateBody<T>(predicate: Predicate<T>) {
  const validate = contract((body: unknown) => body as T, {
    name: "requestBody",
    input: predicate,
    mode: "strict",
  })
  return async (c: Context, next: Next) => {
    const body = await c.req.json()
    c.set("validatedBody", validate(body))
    await next()
  }
}

const OrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string(),
    country: z.string().length(2),
  }),
})

const isOrder = defineGuard((v) => OrderSchema.parse(v))

const app = new Hono()

app.post("/orders", validateBody(isOrder), (c) => {
  const order = c.get("validatedBody") as z.infer<typeof OrderSchema>
  return c.json({
    orderId: crypto.randomUUID(),
    productId: order.productId,
    quantity: order.quantity,
    status: "pending",
  })
})
```

## Response validation

Wrap handler return values in a contract to catch unexpected response shapes.

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const PaginatedSchema = z.object({
  data: z.array(z.record(z.unknown())),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
})

const isPaginated = defineGuard((v) => PaginatedSchema.parse(v))

const listProducts = contract(
  async (page: number) => {
    const pageSize = 20
    const offset = (page - 1) * pageSize
    const rows = await db.query("SELECT * FROM products LIMIT ? OFFSET ?", [pageSize, offset])
    const [{ total }] = await db.query("SELECT COUNT(*) as total FROM products")
    return { data: rows, total, page }
  },
  { name: "GET /products", output: isPaginated, mode: "warn" },
)
```

## Error handling middleware

In strict mode, contract violations throw errors with `name` set to `"VowwchViolationError"` and a `violation` property. Catch these in Hono's error handler.

```ts
import { Hono } from "hono"
import type { Violation } from "vowwch"

const app = new Hono()

app.onError((err, c) => {
  if (err.name === "VowwchViolationError") {
    const { name, side, parserError } = (err as Error & { violation: Violation }).violation
    return c.json({ error: "Validation failed", contract: name, side, detail: parserError }, 422)
  }
  return c.json({ error: "Internal server error" }, 500)
})
```

## Contracted route handler factory

Use `createContractor` to share violation handling across all route contracts.

```ts
import { createContractor, type Violation } from "vowwch"

const violations: Violation[] = []

const { contract: route } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    violations.push(v)
  },
})
```

Apply the shared contractor to each handler:

```ts
import { defineGuard } from "vowwch"
import { z } from "zod"

const isUserId = defineGuard((v) => z.string().uuid().parse(v))
const isUserArray = (v: unknown): v is unknown[] => Array.isArray(v)

const getUser = route(
  async (id: string) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) throw new Error("Not found")
    return user
  },
  {
    name: "GET /users/:id",
    input: isUserId,
  },
)

const listUsers = route(
  async () => {
    return db.user.findMany({ take: 50 })
  },
  {
    name: "GET /users",
    output: isUserArray,
  },
)

app.get("/users/:id", async (c) => {
  const user = await getUser(c.req.param("id"))
  return c.json(user)
})

app.get("/users", async (c) => {
  const users = await listUsers()
  return c.json(users)
})
```
