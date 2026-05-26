import { describe, it, expect, vi } from "vitest"
import { batch } from "@/batch"
import { defineGuard } from "@/guard"
import type { Violation, Predicate } from "@/types"

const isNumber: Predicate<number> = (v: unknown): v is number => typeof v === "number"
const isString: Predicate<string> = (v: unknown): v is string => typeof v === "string"

describe("batch", () => {
  it("passes all valid items to the function", () => {
    const fn = (items: number[]) => items.reduce((a, b) => a + b, 0)
    const wrapped = batch(fn, { name: "sum", item: isNumber })
    expect(wrapped([1, 2, 3])).toBe(6)
  })

  it("filters invalid items in warn mode and fires onViolation per item", () => {
    const violations: Violation[] = []
    const fn = (items: number[]) => items.reduce((a, b) => a + b, 0)
    const wrapped = batch(fn, {
      name: "sum",
      item: isNumber,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    const result = wrapped([1, "bad" as unknown as number, 3])
    expect(result).toBe(4)
    expect(violations).toHaveLength(1)
    expect(violations[0]?.itemIndex).toBe(1)
    expect(violations[0]?.actual).toBe("bad")
    expect(violations[0]?.args).toEqual(["bad"])
    expect(violations[0]?.side).toBe("input")
  })

  it("throws on first invalid item in strict mode and never calls function", () => {
    const fn = vi.fn((items: number[]) => items.length)
    const wrapped = batch(fn, { name: "count", item: isNumber, mode: "strict" })
    try {
      wrapped(["bad" as unknown as number, 1])
      expect.fail("should have thrown")
    } catch (err: unknown) {
      const e = err as Error & { violation: Violation }
      expect(e.name).toBe("VowwchViolationError")
      expect(e.violation.itemIndex).toBe(0)
    }
    expect(fn).not.toHaveBeenCalled()
  })

  it("fires onViolation on invalid output in warn mode", () => {
    const violations: Violation[] = []
    const fn = () => 42 as unknown as string
    const wrapped = batch(fn, {
      name: "getStr",
      output: isString,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    wrapped([])
    expect(violations).toHaveLength(1)
    expect(violations[0]?.side).toBe("output")
  })

  it("throws on invalid output in strict mode", () => {
    const fn = () => 42 as unknown as string
    const wrapped = batch(fn, { name: "getStr", output: isString, mode: "strict" })
    expect(() => wrapped([])).toThrow("[vowwch]")
  })

  it("passes everything through in silent mode with no violations", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const fn = (items: number[]) => items.length
    const wrapped = batch(fn, { name: "count", item: isNumber, mode: "silent" })
    const result = wrapped(["bad" as unknown as number, 1])
    expect(result).toBe(2)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("handles empty input array with no violations", () => {
    const violations: Violation[] = []
    const fn = (items: number[]) => items.length
    const wrapped = batch(fn, {
      name: "count",
      item: isNumber,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    expect(wrapped([])).toBe(0)
    expect(violations).toHaveLength(0)
  })

  it("calls console.error when no onViolation in warn mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const fn = (items: number[]) => items.length
    const wrapped = batch(fn, { name: "count", item: isNumber, mode: "warn" })
    wrapped(["bad" as unknown as number])
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it("handles async output validation in warn mode", async () => {
    const violations: Violation[] = []
    const fn = (): Promise<string> => Promise.resolve(42 as unknown as string)
    const wrapped = batch<unknown, Promise<string>>(fn, {
      name: "asyncOut",
      output: isString,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    await wrapped([])
    expect(violations).toHaveLength(1)
    expect(violations[0]?.side).toBe("output")
  })

  it("includes parserError from defineGuard on item violation", () => {
    const violations: Violation[] = []
    const isPositive = defineGuard((v: unknown) => {
      if (typeof v !== "number" || v <= 0) throw new Error("must be positive")
      return v
    })
    const fn = (items: number[]) => items.length
    const wrapped = batch(fn, {
      name: "countPositive",
      item: isPositive,
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    wrapped([-1, 2, -3])
    expect(violations).toHaveLength(2)
    expect(violations[0]?.parserError).toBe("must be positive")
    expect(violations[0]?.itemIndex).toBe(0)
    expect(violations[1]?.itemIndex).toBe(2)
  })
})
