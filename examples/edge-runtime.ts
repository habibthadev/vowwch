import { batch, defineGuard } from "vowwch"
import type { Violation } from "vowwch"

interface GeoResult {
  lat: number
  lng: number
  label: string
}

const isGeoResult = defineGuard<GeoResult>((value: unknown) => {
  if (value === null || typeof value !== "object") throw new Error("expected object")
  const obj = value as Record<string, unknown>
  if (typeof obj.lat !== "number") throw new Error("lat must be number")
  if (typeof obj.lng !== "number") throw new Error("lng must be number")
  if (typeof obj.label !== "string") throw new Error("label must be string")
  return value as GeoResult
})

const violations: Violation[] = []

const geocodeAll = (addresses: string[]): GeoResult[] =>
  addresses.map((addr) => ({
    lat: 40.7128,
    lng: -74.006,
    label: addr,
  }))

const safeGeocodeAll = batch(geocodeAll, {
  name: "geocodeAll",
  item: (v: unknown): v is string => typeof v === "string" && (v as string).length > 0,
  output: (v: unknown): v is GeoResult[] => Array.isArray(v) && v.every((r) => isGeoResult(r)),
  mode: "warn",
  onViolation: (v) => violations.push(v),
})

const addresses = ["New York, NY", "", "Los Angeles, CA", ""]
const results = safeGeocodeAll(addresses)

console.log("Geocoded:", results.length, "addresses")
console.log("Violations:", violations.length, "invalid items filtered")

export default {
  fetch: async (): Promise<Response> => {
    const safe = safeGeocodeAll(["Tokyo, JP", "London, UK"])
    return new Response(JSON.stringify(safe), {
      headers: { "content-type": "application/json" },
    })
  },
}
