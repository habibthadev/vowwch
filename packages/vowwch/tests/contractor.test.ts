import { describe, it, expect, vi } from "vitest"
import { createContractor } from "@/contractor"
import type { Violation, Predicate } from "@/types"

const isString: Predicate<string> = (v: unknown): v is string => typeof v === "string"

describe("createContractor", () => {
  it("propagates default mode to wrapped contracts", () => {
    const { contract } = createContractor({ mode: "strict" })
    const fn = (x: string) => x
    const wrapped = contract(fn, { name: "echo", input: isString })
    expect(() => wrapped(42 as unknown as string)).toThrow("[vowwch]")
  })

  it("propagates default onViolation to wrapped contracts", () => {
    const violations: Violation[] = []
    const { contract } = createContractor({
      mode: "warn",
      onViolation: (v) => violations.push(v),
    })
    const fn = (x: string) => x
    const wrapped = contract(fn, { name: "echo", input: isString })
    wrapped(42 as unknown as string)
    expect(violations).toHaveLength(1)
  })

  it("per-contract mode overrides default", () => {
    const violations: Violation[] = []
    const { contract } = createContractor({
      mode: "strict",
      onViolation: (v) => violations.push(v),
    })
    const fn = (x: string) => x
    const wrapped = contract(fn, { name: "echo", input: isString, mode: "warn" })
    wrapped(42 as unknown as string)
    expect(violations).toHaveLength(1)
  })

  it("per-contract onViolation overrides default", () => {
    const defaultViolations: Violation[] = []
    const localViolations: Violation[] = []
    const { contract } = createContractor({
      mode: "warn",
      onViolation: (v) => defaultViolations.push(v),
    })
    const fn = (x: string) => x
    const wrapped = contract(fn, {
      name: "echo",
      input: isString,
      onViolation: (v) => localViolations.push(v),
    })
    wrapped(42 as unknown as string)
    expect(defaultViolations).toHaveLength(0)
    expect(localViolations).toHaveLength(1)
  })

  it("two contractor instances are fully independent", () => {
    const v1: Violation[] = []
    const v2: Violation[] = []
    const c1 = createContractor({ mode: "warn", onViolation: (v) => v1.push(v) })
    const c2 = createContractor({ mode: "warn", onViolation: (v) => v2.push(v) })
    const fn = (x: string) => x
    const w1 = c1.contract(fn, { name: "a", input: isString })
    const w2 = c2.contract(fn, { name: "b", input: isString })
    w1(1 as unknown as string)
    w2(2 as unknown as string)
    expect(v1).toHaveLength(1)
    expect(v2).toHaveLength(1)
    expect(v1[0]?.name).toBe("a")
    expect(v2[0]?.name).toBe("b")
  })

  it("defaults to warn mode with console.error when no defaults provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { contract } = createContractor({})
    const fn = (x: string) => x
    const wrapped = contract(fn, { name: "echo", input: isString })
    wrapped(42 as unknown as string)
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })
})
