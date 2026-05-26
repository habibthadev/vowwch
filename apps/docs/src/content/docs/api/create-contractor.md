---
title: createContractor()
description: Create a contractor with shared default options for all contracts it produces.
---

`createContractor()` builds a contractor object preconfigured with default `mode` and `onViolation` settings. Every contract created through the contractor inherits those defaults, with per-contract options taking precedence.

## Signature

```ts
function createContractor(defaults: ContractorDefaults): { contract: typeof contract }
```

## ContractorDefaults

```ts
interface ContractorDefaults {
  mode?: Mode
  onViolation?: ViolationHandler
}
```

| Property      | Type               | Required | Default  | Description                                 |
| ------------- | ------------------ | -------- | -------- | ------------------------------------------- |
| `mode`        | `Mode`             | no       | `"warn"` | Default enforcement mode for all contracts  |
| `onViolation` | `ViolationHandler` | no       | —        | Default violation handler for all contracts |

## Return Value

An object with a single `contract` method. This method has the same signature as the standalone `contract()` function. Options provided on individual `contract()` calls override the contractor defaults.

```ts
const { contract } = createContractor({ mode: "strict" })
```

## How Merging Works

The contractor merges defaults with per-contract options using a shallow override. If a contract specifies `mode` or `onViolation`, that value is used instead of the default. If the contract omits them, the defaults apply.

```ts
import { createContractor } from "vowwch"

const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => console.error(v),
})

const isString = (v: unknown): v is string => typeof v === "string"

const a = contract((s: string) => s.toUpperCase(), { name: "a", input: isString })
// mode: "warn", onViolation: console.error (from defaults)

const b = contract((s: string) => s.toLowerCase(), { name: "b", input: isString, mode: "strict" })
// mode: "strict" (overridden), onViolation: console.error (from defaults)
```

## Shared Error Reporting

Use a contractor to centralize violation reporting across your application:

```ts
import { createContractor, defineGuard } from "vowwch"
import type { Violation } from "vowwch"

const violations: Violation[] = []

const { contract } = createContractor({
  mode: "warn",
  onViolation: (v) => {
    violations.push(v)
    fetch("/api/violations", {
      method: "POST",
      body: JSON.stringify({
        name: v.name,
        side: v.side,
        actual: v.actual,
        timestamp: v.timestamp,
        stack: v.stack,
      }),
    })
  },
})

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const double = contract((n: number) => n * 2, { name: "double", output: isPositive })

const triple = contract((n: number) => n * 3, { name: "triple", output: isPositive })

double(-1) // -2, violation reported
triple(-1) // -3, violation reported
console.log(violations.length) // 2
```

## Environment-Based Mode

A single `createContractor()` call at app startup can set the mode for an entire module based on the environment:

```ts
import { createContractor } from "vowwch"

const { contract } = createContractor({
  mode: process.env.NODE_ENV === "production" ? "silent" : "strict",
})

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

const parseConfig = contract((raw: string) => JSON.parse(raw), {
  name: "parseConfig",
  output: isObject,
})
```

In development, `parseConfig` throws on invalid output. In production, the contract is a zero-cost passthrough.

## Overriding Defaults Per Contract

Individual contracts can escalate or relax the mode regardless of the contractor default:

```ts
import { createContractor } from "vowwch"

const { contract } = createContractor({ mode: "warn" })

const isString = (v: unknown): v is string => typeof v === "string"

const critical = contract((data: string) => JSON.parse(data), { name: "critical", mode: "strict" })

const optional = contract((data: string) => data.trim(), {
  name: "optional",
  input: isString,
  mode: "silent",
})
```

`critical` throws on violations despite the contractor default of `"warn"`. `optional` skips validation entirely.

## When to Use createContractor

**Centralized config** — When multiple modules share the same mode or violation handler, a contractor avoids repeating options on every call.

**Team conventions** — Export a pre-configured contractor from a shared module so all team members use consistent settings.

**Environment switching** — Set the mode once based on `NODE_ENV` or a feature flag rather than scattering conditionals across every contract.

**Error tracking integration** — Wire a single `onViolation` handler to Sentry, Datadog, or a custom logging service and every contract created through the contractor reports through that channel.

## Gotchas

The return value is `{ contract }`, not a function. Destructure it before use:

```ts
const { contract } = createContractor({ mode: "strict" })
```

Calling `createContractor({})` is valid. The resulting contractor behaves identically to the standalone `contract()` with all defaults.

The contractor does not deep-merge nested objects. Only `mode` and `onViolation` are supported as defaults. Input and output predicates are always specified per-contract.
