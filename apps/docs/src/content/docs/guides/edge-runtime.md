---
title: Edge Runtime
description: Deploy vowwch contracts on Cloudflare Workers, Vercel Edge, and Deno Deploy with zero dependencies.
---

vowwch has zero dependencies and uses no Node.js-specific APIs. It runs natively on every edge runtime without polyfills, adapters, or conditional imports.

## Why vowwch works on the edge

Edge runtimes restrict available APIs and impose strict bundle size limits. Libraries that depend on Node.js built-ins (`fs`, `path`, `crypto`, `buffer`) fail at import time on these platforms. vowwch avoids this entirely: it is pure ECMAScript with no transitive dependencies. The entire library adds under 2 KB gzipped to your bundle.

## Cloudflare Workers

```ts
import { contract, defineGuard, createContractor } from "vowwch"
import { z } from "zod"

const GeoRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive().max(50000),
})

const isGeoRequest = defineGuard((v) => GeoRequestSchema.parse(v))

const isGeoResponse = (v: unknown): v is { results: unknown[]; count: number } =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as Record<string, unknown>).results) &&
  typeof (v as Record<string, unknown>).count === "number"

const searchNearby = contract(
  async (input: z.infer<typeof GeoRequestSchema>) => {
    const res = await fetch(
      `https://api.example.com/nearby?lat=${input.latitude}&lng=${input.longitude}&r=${input.radius}`,
    )
    const data = (await res.json()) as { results: unknown[] }
    return { results: data.results, count: data.results.length }
  },
  {
    name: "searchNearby",
    input: isGeoRequest,
    output: isGeoResponse,
    mode: "warn",
  },
)

export default {
  async fetch(request: Request): Promise<Response> {
    const body = await request.json()
    const result = await searchNearby(body as z.infer<typeof GeoRequestSchema>)
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    })
  },
}
```

## Vercel Edge Functions

```ts
import { contract, createContractor, type Violation } from "vowwch"

const { contract: edgeContract } = createContractor({
  mode: "warn",
  onViolation: (v: Violation) => {
    fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify({
        source: "vercel-edge",
        contract: v.name,
        side: v.side,
        parserError: v.parserError,
        timestamp: v.timestamp,
      }),
    })
  },
})

const isAnalyticsEvent = (
  v: unknown,
): v is { event: string; properties: Record<string, unknown> } =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Record<string, unknown>).event === "string" &&
  typeof (v as Record<string, unknown>).properties === "object"

const trackEvent = edgeContract(
  async (event: { event: string; properties: Record<string, unknown> }) => {
    await fetch("https://analytics.example.com/track", {
      method: "POST",
      body: JSON.stringify(event),
    })
    return { accepted: true, event: event.event }
  },
  { name: "trackEvent", input: isAnalyticsEvent },
)

export default async function handler(request: Request) {
  const body = await request.json()
  const result = await trackEvent(body as { event: string; properties: Record<string, unknown> })
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } })
}

export const config = { runtime: "edge" }
```

## Deno Deploy

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const TransformInputSchema = z.object({
  text: z.string().min(1).max(10000),
  operations: z.array(z.enum(["uppercase", "trim", "reverse"])),
})

const isTransformInput = defineGuard((v) => TransformInputSchema.parse(v))

const isStringResult = (v: unknown): v is { result: string } =>
  typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).result === "string"

const transformText = contract(
  (input: z.infer<typeof TransformInputSchema>) => {
    let result = input.text
    for (const op of input.operations) {
      if (op === "uppercase") result = result.toUpperCase()
      if (op === "trim") result = result.trim()
      if (op === "reverse") result = result.split("").reverse().join("")
    }
    return { result }
  },
  {
    name: "transformText",
    input: isTransformInput,
    output: isStringResult,
    mode: "strict",
  },
)

Deno.serve(async (req: Request) => {
  const body = await req.json()
  const output = transformText(body as z.infer<typeof TransformInputSchema>)
  return new Response(JSON.stringify(output), {
    headers: { "Content-Type": "application/json" },
  })
})
```

## Edge-specific violation handlers

Some edge runtimes have limited or no `console.error` support. The default `warn` mode handler calls `console.error`, which may silently drop output. Use `onViolation` to send violations to an external logging endpoint instead.

```ts
import { createContractor, type Violation } from "vowwch"

const { contract: edgeContract } = createContractor({
  mode: "warn",
  onViolation: (v: Violation) => {
    fetch("https://logs.example.com/violations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract: v.name,
        side: v.side,
        actual: typeof v.actual,
        parserError: v.parserError,
        timestamp: v.timestamp,
        itemIndex: v.itemIndex,
      }),
    })
  },
})
```

## Silent mode for performance-critical paths

Edge functions are often invoked on every request with strict latency budgets. Use `silent` mode for hot paths where predicate evaluation would add unacceptable overhead. In silent mode, `contract` and `batch` return the original function unwrapped.

```ts
import { contract } from "vowwch"

const isNumber = (v: unknown): v is number => typeof v === "number"

const computeScore = contract(
  (weights: number[], features: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i] * features[i]
    }
    return sum
  },
  {
    name: "computeScore",
    mode: "silent",
  },
)
```

## Bundle size

vowwch adds under 2 KB gzipped to your bundle. Measured at **824 B** (ESM) and **905 B** (CJS) minified and gzipped. There are no transitive dependencies, no tree-shaking surprises, and no dynamic `require` calls. What you import is what you ship.
