import type { Mode, Violation, ViolationHandler } from "@/types"

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
