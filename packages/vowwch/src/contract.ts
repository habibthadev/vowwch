import type { ContractOptions, Mode, Predicate } from "@/types"
import type { PredicateWithParserError } from "@/internals"
import { readParserError, createViolation, handleViolation } from "@/internals"

export function contract<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: ContractOptions<TArgs, TReturn>,
): (...args: TArgs) => TReturn {
  const mode: Mode = options.mode ?? "warn"

  if (mode === "silent") {
    return fn
  }

  return (...args: TArgs): TReturn => {
    if (options.input !== undefined) {
      if (typeof options.input === "function") {
        const predicate = options.input as PredicateWithParserError
        if (!predicate(args[0])) {
          const parserError = readParserError(predicate)
          const violation = createViolation(
            options.name,
            "input",
            args[0],
            [...args],
            parserError,
            undefined,
          )
          handleViolation(violation, mode, options.onViolation)
        }
      } else {
        const predicates = options.input as { [K in keyof TArgs]: Predicate<TArgs[K]> }
        for (let i = 0; i < (predicates as unknown[]).length; i++) {
          const predicate = (predicates as unknown as PredicateWithParserError[])[i]
          if (predicate !== undefined && !predicate(args[i])) {
            const parserError = readParserError(predicate)
            const violation = createViolation(
              options.name,
              "input",
              args[i],
              [...args],
              parserError,
              undefined,
            )
            handleViolation(violation, mode, options.onViolation)
          }
        }
      }
    }

    const result = fn(...args)

    if (options.output !== undefined) {
      const outputPredicate = options.output as PredicateWithParserError

      if (result instanceof Promise) {
        return result.then((resolved: Awaited<TReturn>) => {
          if (!outputPredicate(resolved)) {
            const parserError = readParserError(outputPredicate)
            const violation = createViolation(
              options.name,
              "output",
              resolved,
              [...args],
              parserError,
              undefined,
            )
            handleViolation(violation, mode, options.onViolation)
          }
          return resolved
        }) as TReturn
      }

      if (!outputPredicate(result)) {
        const parserError = readParserError(outputPredicate)
        const violation = createViolation(
          options.name,
          "output",
          result,
          [...args],
          parserError,
          undefined,
        )
        handleViolation(violation, mode, options.onViolation)
      }
    }

    return result
  }
}
