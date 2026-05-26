import { describe, it, expect, vi } from "vitest"
import { contract } from "@/contract"
import type { Violation, Predicate } from "@/types"
import { defineGuard } from "@/guard"

const isString: Predicate<string> = (v: unknown): v is string => typeof v === "string"
const isNumber: Predicate<number> = (v: unknown): v is number => typeof v === "number"

describe("contract", () => {
  describe("synchronous functions", () => {
    it("passes through valid input and output unchanged", () => {
      const fn = (x: string) => x.toUpperCase()
      const wrapped = contract(fn, { name: "upper", input: isString, output: isString })
      expect(wrapped("hello")).toBe("HELLO")
    })

    it("throws VowwchViolationError on invalid input in strict mode", () => {
      const fn = (x: string) => x.toUpperCase()
      const wrapped = contract(fn, { name: "upper", input: isString, mode: "strict" })
      try {
        wrapped(42 as unknown as string)
        expect.fail("should have thrown")
      } catch (err: unknown) {
        const e = err as Error & { violation: Violation }
        expect(e.name).toBe("VowwchViolationError")
        expect(e.violation.side).toBe("input")
        expect(e.violation.name).toBe("upper")
        expect(e.violation.actual).toBe(42)
      }
    })

    it("throws VowwchViolationError on invalid output in strict mode", () => {
      const fn = () => 42 as unknown as string
      const wrapped = contract(fn, { name: "getStr", output: isString, mode: "strict" })
      try {
        wrapped()
        expect.fail("should have thrown")
      } catch (err: unknown) {
        const e = err as Error & { violation: Violation }
        expect(e.name).toBe("VowwchViolationError")
        expect(e.violation.side).toBe("output")
        expect(e.violation.actual).toBe(42)
      }
    })
  })

  describe("asynchronous functions", () => {
    it("throws on invalid output after resolution in strict mode", async () => {
      const fn = (): Promise<string> => Promise.resolve(42 as unknown as string)
      const wrapped = contract(fn, { name: "asyncStr", output: isString, mode: "strict" })
      await expect(wrapped()).rejects.toThrow("[vowwch]")
    })

    it("passes through valid async output without violation", async () => {
      const violations: Violation[] = []
      const fn = (): Promise<string> => Promise.resolve("hello")
      const wrapped = contract(fn, {
        name: "asyncStr",
        output: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      const result = await wrapped()
      expect(result).toBe("hello")
      expect(violations).toHaveLength(0)
    })
  })

  describe("warn mode", () => {
    it("calls onViolation on invalid input and still runs the function", () => {
      const violations: Violation[] = []
      const fn = (x: string) => x.length
      const wrapped = contract(fn, {
        name: "len",
        input: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      const result = wrapped(42 as unknown as string)
      expect(violations).toHaveLength(1)
      expect(violations[0]?.side).toBe("input")
      expect(result).toBeUndefined()
    })

    it("calls onViolation on invalid output and still returns the result", () => {
      const violations: Violation[] = []
      const fn = () => 42 as unknown as string
      const wrapped = contract(fn, {
        name: "getStr",
        output: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      const result = wrapped()
      expect(violations).toHaveLength(1)
      expect(violations[0]?.side).toBe("output")
      expect(result).toBe(42)
    })

    it("calls console.error when no onViolation is provided", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {})
      const fn = (x: string) => x
      const wrapped = contract(fn, { name: "echo", input: isString, mode: "warn" })
      wrapped(123 as unknown as string)
      expect(spy).toHaveBeenCalledOnce()
      const violation = spy.mock.calls[0]?.[0] as Violation
      expect(violation.side).toBe("input")
      spy.mockRestore()
    })
  })

  describe("silent mode", () => {
    it("fires no violation and does not throw", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {})
      const fn = (x: string) => x
      const wrapped = contract(fn, { name: "echo", input: isString, mode: "silent" })
      expect(wrapped(42 as unknown as string)).toBe(42)
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe("tuple input predicates", () => {
    it("validates each argument positionally", () => {
      const violations: Violation[] = []
      const fn = (a: string, b: number) => `${a}${String(b)}`
      const wrapped = contract(fn, {
        name: "concat",
        input: [isString, isNumber] as [Predicate<string>, Predicate<number>],
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped("hi", "bad" as unknown as number)
      expect(violations).toHaveLength(1)
      expect(violations[0]?.actual).toBe("bad")
      expect(violations[0]?.args).toEqual(["hi", "bad"])
    })
  })

  describe("violation properties", () => {
    it("has a string stack from the call site", () => {
      const violations: Violation[] = []
      const fn = (x: string) => x
      const wrapped = contract(fn, {
        name: "echo",
        input: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped(1 as unknown as string)
      expect(typeof violations[0]?.stack).toBe("string")
    })

    it("has a valid timestamp", () => {
      const violations: Violation[] = []
      const before = Date.now()
      const fn = (x: string) => x
      const wrapped = contract(fn, {
        name: "echo",
        input: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped(1 as unknown as string)
      const after = Date.now()
      const ts = violations[0]?.timestamp ?? 0
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it("has name matching the options name", () => {
      const violations: Violation[] = []
      const fn = (x: string) => x
      const wrapped = contract(fn, {
        name: "myContract",
        input: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped(1 as unknown as string)
      expect(violations[0]?.name).toBe("myContract")
    })
  })

  describe("partial predicates", () => {
    it("works with output-only contract", () => {
      const violations: Violation[] = []
      const fn = () => 42 as unknown as string
      const wrapped = contract(fn, {
        name: "outOnly",
        output: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped()
      expect(violations).toHaveLength(1)
      expect(violations[0]?.side).toBe("output")
    })

    it("works with input-only contract", () => {
      const violations: Violation[] = []
      const fn = (x: string) => x.length
      const wrapped = contract(fn, {
        name: "inOnly",
        input: isString,
        mode: "warn",
        onViolation: (v) => violations.push(v),
      })
      wrapped(42 as unknown as string)
      expect(violations).toHaveLength(1)
      expect(violations[0]?.side).toBe("input")
    })
  })

  describe("parserError integration", () => {
    it("includes parserError from defineGuard on violation", () => {
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
      expect(violations[0]?.parserError).toBe("must be positive")
    })
  })
})
