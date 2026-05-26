import { describe, it, expect } from "vitest"
import { defineGuard } from "@/guard"
import { contract } from "@/contract"
import type { Violation } from "@/types"

describe("defineGuard", () => {
  it("returns true for valid input when parser succeeds", () => {
    const isPositive = defineGuard((v: unknown) => {
      if (typeof v !== "number" || v <= 0) throw new Error("must be positive")
      return v
    })
    expect(isPositive(5)).toBe(true)
  })

  it("returns false for invalid input when parser throws", () => {
    const isPositive = defineGuard((v: unknown) => {
      if (typeof v !== "number" || v <= 0) throw new Error("must be positive")
      return v
    })
    expect(isPositive(-1)).toBe(false)
  })

  it("attaches parserError to the predicate after a failed parse", () => {
    const isPositive = defineGuard((v: unknown) => {
      if (typeof v !== "number" || v <= 0) throw new Error("must be positive")
      return v
    })
    isPositive(-1)
    const pred = isPositive as unknown as { _parserError?: string }
    expect(pred._parserError).toBe("must be positive")
  })

  it("clears parserError after being read by contract", () => {
    const violations: Violation[] = []
    const isPositive = defineGuard((v: unknown) => {
      if (typeof v !== "number" || v <= 0) throw new Error("must be positive")
      return v
    })
    const fn = (x: number) => x
    const wrapped = contract(fn, {
      name: "pos",
      input: isPositive,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    wrapped(-1 as unknown as number)
    const pred = isPositive as unknown as { _parserError?: string }
    expect(pred._parserError).toBeUndefined()
    expect(violations[0]?.parserError).toBe("must be positive")
  })

  it("works with Zod-style .parse() pattern", () => {
    const schema = {
      parse(v: unknown): string {
        if (typeof v !== "string") throw new Error("Expected string")
        return v
      },
    }
    const isValidString = defineGuard((v: unknown) => schema.parse(v))
    expect(isValidString("hello")).toBe(true)
    expect(isValidString(42)).toBe(false)
    const pred = isValidString as unknown as { _parserError?: string }
    expect(pred._parserError).toBe("Expected string")
  })

  it("handles non-Error thrown values", () => {
    const guard = defineGuard((v: unknown) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (typeof v !== "string") throw "not a string"
      return v
    })
    expect(guard(42)).toBe(false)
    const pred = guard as unknown as { _parserError?: string }
    expect(pred._parserError).toBe("not a string")
  })

  it("handles non-string non-Error thrown values", () => {
    const guard = defineGuard((v: unknown) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (typeof v !== "string") throw 123
      return v
    })
    expect(guard(42)).toBe(false)
    const pred = guard as unknown as { _parserError?: string }
    expect(pred._parserError).toBe("Unknown parse error")
  })
})
