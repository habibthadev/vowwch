/**
 * @module vowwch
 * @version 0.1.0
 * @license MIT
 * @see https://github.com/habibthadev/vowwch
 *
 * Zero-dependency runtime contracts for any JavaScript function.
 * This is the vendorable single-file distribution. Paste it in and own it.
 */

export type Predicate<T> = (value: unknown) => value is T

export type Mode = "strict" | "warn" | "silent"

export interface Violation {
  name: string
  side: "input" | "output"
  actual: unknown
  args: unknown[]
  timestamp: number
  stack: string | undefined
  parserError?: string
  itemIndex?: number
}

export type ViolationHandler = (violation: Violation) => void

export interface ContractOptions<TArgs extends unknown[], TReturn> {
  name: string
  input?: Predicate<TArgs[0]> | { [K in keyof TArgs]: Predicate<TArgs[K]> }
  output?: Predicate<Awaited<TReturn>>
  mode?: Mode
  onViolation?: ViolationHandler
}

export interface ContractorDefaults {
  mode?: Mode
  onViolation?: ViolationHandler
}

export interface BatchOptions<TItem, TReturn> {
  name: string
  item?: Predicate<TItem>
  output?: Predicate<Awaited<TReturn>>
  mode?: Mode
  onViolation?: ViolationHandler
}

export type PredicateWithParserError = ((value: unknown) => boolean) & {
  _parserError?: string | undefined
}

export function readParserError(predicate: PredicateWithParserError): string | undefined {
  const err = predicate._parserError
  if (err !== undefined) {
    predicate._parserError = undefined
  }
  return err
}

export function createViolation(
  name: string,
  side: "input" | "output",
  actual: unknown,
  args: unknown[],
  parserError: string | undefined,
  itemIndex: number | undefined,
): Violation {
  const violation: Violation = {
    name,
    side,
    actual,
    args,
    timestamp: Date.now(),
    stack: new Error().stack,
  }
  if (parserError !== undefined) {
    violation.parserError = parserError
  }
  if (itemIndex !== undefined) {
    violation.itemIndex = itemIndex
  }
  return violation
}

export function createVowwchViolationError(violation: Violation): Error & { violation: Violation } {
  const err = new Error(`[vowwch] ${violation.side} violation in "${violation.name}"`) as Error & {
    violation: Violation
  }
  err.name = "VowwchViolationError"
  err.violation = violation
  return err
}

export function handleViolation(
  violation: Violation,
  mode: Mode,
  onViolation: ViolationHandler | undefined,
): void {
  if (mode === "strict") {
    throw createVowwchViolationError(violation)
  }
  if (onViolation !== undefined) {
    onViolation(violation)
  } else {
    console.error(violation)
  }
}

type GuardPredicate<T> = Predicate<T> & {
  _parserError?: string | undefined
}

export function defineGuard<T>(parser: (value: unknown) => T): Predicate<T> {
  const predicate: GuardPredicate<T> = (value: unknown): value is T => {
    try {
      parser(value)
      return true
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown parse error"
      Object.defineProperty(predicate, "_parserError", {
        value: message,
        writable: true,
        enumerable: false,
        configurable: true,
      })
      return false
    }
  }

  return predicate
}

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
