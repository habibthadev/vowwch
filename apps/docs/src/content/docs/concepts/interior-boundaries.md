---
title: Interior Boundaries
description: Why validating at the edge of your application is not enough, and how contracts protect function-level boundaries inside your codebase.
---

## What are interior boundaries

Every application has exterior boundaries: the HTTP handler that parses a request body, the form validator that checks user input, the API client that decodes a response. These are the places where most teams put their validation logic.

Interior boundaries are different. They are the function calls inside your codebase where data moves between modules, layers, or subsystems. The service function that accepts a user object from the controller. The repository method that returns rows to the business logic layer. The utility function that transforms a price before it reaches the invoice generator.

These boundaries are invisible in most codebases. TypeScript types mark them at compile time, but at runtime, nothing enforces them. Data flows freely, and when it arrives in the wrong shape, the resulting error surfaces far from its origin.

## Why edge-only validation is insufficient

Edge validation catches malformed data at the door. It does not protect against what happens inside. Three categories of bugs slip past edge validation:

**Data mutation between functions.** A controller validates an incoming request, then passes it through a chain of service functions. One of those functions strips a required field or coerces a number to a string. The validation at the edge saw correct data. The function three layers deep receives something different.

**Logic bugs in transformation.** A function that maps database rows to domain objects has a subtle bug: it swaps `createdAt` and `updatedAt`. The types match because both are `Date`. The edge validator passed the raw row. Nobody checks the output of the mapping function.

**Refactoring drift.** A developer changes the return type of a shared utility. TypeScript catches the callers they update, but misses the callers in a dynamically constructed call chain or behind a type assertion. The code compiles. The runtime breaks.

## The layered validation pattern

The strongest validation strategy uses two layers. Edge validation libraries like Zod parse incoming data into known shapes. Interior contracts verify that data maintains its shape as it flows through your system.

```ts
import { z } from "zod"
import { contract, defineGuard } from "vowwch"

const OrderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    }),
  ),
  currency: z.enum(["USD", "EUR", "GBP"]),
})

type Order = z.infer<typeof OrderSchema>

const isOrder = defineGuard((v) => OrderSchema.parse(v))

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const calculateOrderTotal = contract(
  (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  },
  {
    name: "calculateOrderTotal",
    input: isOrder,
    output: isPositive,
    mode: "warn",
  },
)
```

Zod validates the order when it enters the system. The contract on `calculateOrderTotal` verifies two things: that the order still has its expected shape when it reaches the calculation logic, and that the calculation produces a positive number. If a bug upstream strips the `items` array or a rounding error produces zero, the contract reports it.

## The function that trusts its caller

Consider a service function that computes a shipping estimate:

```ts
function estimateShipping(weight: number, distance: number): number {
  const rate = weight > 50 ? 0.75 : 0.5
  return Math.round(rate * distance * 100) / 100
}
```

This function trusts that `weight` and `distance` are positive numbers. TypeScript says they are. But the caller might pass the result of a calculation that produced `NaN`, or a value read from a cache that was serialized as a string. The function will not throw. It will return `NaN` or a nonsensical result, and the bug propagates silently.

A contract makes the trust explicit and enforced:

```ts
const isPositiveFinite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0

const estimateShipping = contract(
  (weight: number, distance: number): number => {
    const rate = weight > 50 ? 0.75 : 0.5
    return Math.round(rate * distance * 100) / 100
  },
  {
    name: "estimateShipping",
    input: isPositiveFinite,
    output: isPositiveFinite,
    mode: "warn",
  },
)
```

In `warn` mode, if `NaN` reaches this function, the violation is reported with the contract name, the side that failed, and the actual value received. The function still executes, but your monitoring system now knows exactly where the data integrity broke down.

## Contracts as living documentation

A contract declares what a function requires and what it guarantees. Unlike a JSDoc comment or a TypeScript type annotation, this declaration is enforced at runtime. It cannot fall out of date because the runtime checks it on every call.

When a new developer reads a contracted function, the predicates communicate the function's actual data expectations, not the aspirational ones that a type signature describes. When a refactor changes those expectations, the contract either needs to change with them or it starts reporting violations. Both outcomes surface the change immediately.

## Where to add contracts

Not every function needs a contract. The overhead is small but nonzero: a function call and a predicate evaluation per invocation. Place contracts where the value is highest:

**Service layer boundaries** where business logic receives data from controllers, queues, or other services. These functions are called from multiple sites and their inputs are only as correct as the calling code.

**Data access layer returns** where database queries or API calls produce results that your code then trusts implicitly. A contract on the return value catches schema drift and unexpected nulls.

**Shared utility functions** that many modules depend on. A violated contract on a shared function immediately narrows the search for a bug to the callers of that function.

**Critical calculations** where a wrong output has outsized consequences: pricing, permissions, rate limiting. The cost of a contract is negligible compared to the cost of a silent math error in these paths.

Functions that are called once, are trivially simple, or sit on a hot path measured in microseconds are reasonable places to skip contracts or run them in `silent` mode.
