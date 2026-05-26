---
title: Production Setup
description: Configure vowwch for production with environment-based modes, centralized reporting, error tracking, and performance optimization.
---

This guide covers patterns for deploying vowwch contracts in production systems, from environment-based configuration to monitoring and gradual rollout.

## Environment-based mode switching

Switch enforcement modes based on the deployment environment. Use `strict` in development and test to catch violations immediately, `warn` in staging to observe without breaking flows, and `silent` in production for performance-critical hot paths.

```ts
import { createContractor, type Mode } from "vowwch"

function resolveMode(): Mode {
  const env = process.env.NODE_ENV ?? "development"
  if (env === "test") return "strict"
  if (env === "development") return "strict"
  if (env === "staging") return "warn"
  return "warn"
}

const { contract } = createContractor({ mode: resolveMode() })
```

For hot paths in production, override to `silent` per contract:

```ts
const isNumber = (v: unknown): v is number => typeof v === "number"

const computeHash = contract((input: number) => ((input * 2654435761) >>> 0).toString(16), {
  name: "computeHash",
  input: isNumber,
  mode: process.env.NODE_ENV === "production" ? "silent" : "strict",
})
```

## Centralized violation reporting

Use `createContractor` to funnel all violations through a single reporting function. This gives you one place to control logging format, filtering, and forwarding.

```ts
import { createContractor, type Violation } from "vowwch"

function reportViolation(violation: Violation): void {
  const entry = {
    level: "warn",
    type: "contract_violation",
    contract: violation.name,
    side: violation.side,
    parserError: violation.parserError,
    timestamp: violation.timestamp,
    itemIndex: violation.itemIndex,
  }
  console.error(JSON.stringify(entry))
}

const { contract } = createContractor({
  mode: "warn",
  onViolation: reportViolation,
})
```

## Integration with Sentry

Forward violations to Sentry as breadcrumbs. Attach the violation object as context.

```ts
import * as Sentry from "@sentry/node"
import { createContractor, type Violation } from "vowwch"

function reportToSentry(violation: Violation): void {
  Sentry.addBreadcrumb({
    category: "vowwch",
    message: `${violation.side} violation in "${violation.name}"`,
    level: "warning",
    data: { contract: violation.name, side: violation.side, parserError: violation.parserError },
  })
  Sentry.captureMessage(`Contract violation: ${violation.name}`, {
    level: "warning",
    extra: {
      side: violation.side,
      parserError: violation.parserError,
      actualType: typeof violation.actual,
    },
  })
}

const { contract: sentryContract } = createContractor({ mode: "warn", onViolation: reportToSentry })
```

## Integration with Datadog

```ts
import { createContractor, type Violation } from "vowwch"

function reportToDatadog(violation: Violation): void {
  const tagStr = `contract:${violation.name},side:${violation.side}`
  process.stdout.write(`MONITORING|${Date.now()}|1|count|vowwch.violation|#${tagStr}\n`)
  console.error(
    JSON.stringify({
      service: process.env.DD_SERVICE ?? "unknown",
      message: `${violation.side} violation in "${violation.name}"`,
      parserError: violation.parserError,
      timestamp: violation.timestamp,
    }),
  )
}

const { contract: ddContract } = createContractor({ mode: "warn", onViolation: reportToDatadog })
```

## Monitoring patterns

Track violation rates to detect data quality regressions and alert on spikes.

```ts
import { createContractor, type Violation } from "vowwch"

const violationCounts = new Map<string, number>()
const violationWindow: Array<{ key: string; timestamp: number }> = []
const WINDOW_MS = 60_000
const SPIKE_THRESHOLD = 50

function monitorViolation(violation: Violation): void {
  const key = `${violation.name}:${violation.side}`
  violationCounts.set(key, (violationCounts.get(key) ?? 0) + 1)

  const now = Date.now()
  violationWindow.push({ key, timestamp: now })
  while (violationWindow.length > 0 && violationWindow[0].timestamp < now - WINDOW_MS) {
    violationWindow.shift()
  }
  if (violationWindow.length >= SPIKE_THRESHOLD) {
    console.error(JSON.stringify({ alert: "violation_spike", count: violationWindow.length }))
  }
}

const { contract: monitored } = createContractor({ mode: "warn", onViolation: monitorViolation })
```

## Performance considerations

In `silent` mode, `contract` and `batch` return the original function without wrapping. There is no predicate evaluation and no violation handling. This makes silent mode a zero-cost abstraction for production hot paths.

```ts
import { contract, batch } from "vowwch"

const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0

const hotPathCalc = contract((n: number) => n * n + 1, {
  name: "hotPathCalc",
  input: isPositive,
  mode: "silent",
})

const processRecords = batch((items: number[]) => items.reduce((sum, n) => sum + n, 0), {
  name: "processRecords",
  item: isPositive,
  mode: "silent",
})
```

Reserve `strict` and `warn` modes for system boundaries: API handlers, database queries, third-party integrations. Internal function-to-function contracts in tight loops should use `silent` in production.

## Gradual rollout strategy

Start with `warn` on all contracts. Review violations in monitoring before tightening enforcement.

```ts
import { createContractor, type Mode } from "vowwch"

const SERVICE_MODES: Record<string, Mode> = {
  "auth-service": "strict",
  "payment-service": "warn",
  "analytics-service": "silent",
}

function createServiceContractor(service: string) {
  return createContractor({
    mode: SERVICE_MODES[service] ?? "warn",
    onViolation: (v) => {
      console.error(
        JSON.stringify({ service, contract: v.name, side: v.side, parserError: v.parserError }),
      )
    },
  })
}
```

Progression for a single service:

1. Deploy with `silent` to confirm no runtime errors from the contract wrappers
2. Switch to `warn` and monitor violations for one release cycle
3. Fix the sources of violations surfaced by monitoring
4. Switch to `strict` once violation counts reach near zero
