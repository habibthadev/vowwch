import type { Predicate } from "@/types"

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
