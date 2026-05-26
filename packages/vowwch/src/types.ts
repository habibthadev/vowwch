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
