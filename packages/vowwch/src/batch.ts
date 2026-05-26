import type { BatchOptions, Mode } from "@/types"
import type { PredicateWithParserError } from "@/internals"
import { readParserError, createViolation, handleViolation } from "@/internals"

export function batch<TItem, TReturn>(
  fn: (items: TItem[]) => TReturn,
  options: BatchOptions<TItem, TReturn>,
): (items: TItem[]) => TReturn {
  const mode: Mode = options.mode ?? "warn"

  if (mode === "silent") {
    return fn
  }

  return (items: TItem[]): TReturn => {
    let filteredItems: TItem[] = items

    if (options.item !== undefined) {
      const predicate = options.item as PredicateWithParserError
      filteredItems = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as TItem
        if (predicate(item)) {
          filteredItems.push(item)
        } else {
          const parserError = readParserError(predicate)
          const violation = createViolation(options.name, "input", item, [item], parserError, i)
          handleViolation(violation, mode, options.onViolation)
        }
      }
    }

    const result = fn(filteredItems)

    const originalItems = [...items]

    if (options.output !== undefined) {
      const outputPredicate = options.output as PredicateWithParserError

      if (result instanceof Promise) {
        return result.then((resolved: unknown) => {
          if (!outputPredicate(resolved)) {
            const parserError = readParserError(outputPredicate)
            const violation = createViolation(
              options.name,
              "output",
              resolved,
              originalItems,
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
          [...items],
          parserError,
          undefined,
        )
        handleViolation(violation, mode, options.onViolation)
      }
    }

    return result
  }
}
