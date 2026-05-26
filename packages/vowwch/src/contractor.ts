import type { ContractOptions, ContractorDefaults } from "@/types"
import { contract } from "@/contract"

export function createContractor(defaults: ContractorDefaults): {
  contract: typeof contract
} {
  return {
    contract: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => TReturn,
      options: ContractOptions<TArgs, TReturn>,
    ): ((...args: TArgs) => TReturn) => {
      const merged: ContractOptions<TArgs, TReturn> = { ...options }
      const resolvedMode = options.mode ?? defaults.mode
      if (resolvedMode !== undefined) {
        merged.mode = resolvedMode
      }
      const resolvedHandler = options.onViolation ?? defaults.onViolation
      if (resolvedHandler !== undefined) {
        merged.onViolation = resolvedHandler
      }
      return contract(fn, merged)
    },
  }
}
