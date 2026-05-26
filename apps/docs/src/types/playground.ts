import type { Violation } from "vowwch"

export interface PlaygroundResult {
  output: unknown
  violation: Violation | null
  error: string | null
  duration: number
}
