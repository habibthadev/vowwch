import { describe, it, expect } from "vitest"
import { contract, createContractor, defineGuard, batch } from "@/index"
import type {
  Predicate,
  Mode,
  Violation,
  ViolationHandler,
  ContractOptions,
  ContractorDefaults,
  BatchOptions,
} from "@/index"

describe("barrel exports", () => {
  it("exports contract", () => {
    expect(typeof contract).toBe("function")
  })

  it("exports createContractor", () => {
    expect(typeof createContractor).toBe("function")
  })

  it("exports defineGuard", () => {
    expect(typeof defineGuard).toBe("function")
  })

  it("exports batch", () => {
    expect(typeof batch).toBe("function")
  })

  it("type exports are usable", () => {
    const p: Predicate<string> = (v: unknown): v is string => typeof v === "string"
    const m: Mode = "warn"
    const v: Violation = {
      name: "test",
      side: "input",
      actual: null,
      args: [],
      timestamp: Date.now(),
      stack: undefined,
    }
    const h: ViolationHandler = () => {}
    const co: ContractOptions<[string], string> = { name: "test" }
    const cd: ContractorDefaults = {}
    const bo: BatchOptions<string, number> = { name: "test" }
    expect(p("x")).toBe(true)
    expect(m).toBe("warn")
    expect(v.name).toBe("test")
    expect(typeof h).toBe("function")
    expect(co.name).toBe("test")
    expect(cd).toBeDefined()
    expect(bo.name).toBe("test")
  })
})
