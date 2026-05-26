import { shallowRef } from "vue"
import type { Mode, Violation } from "vowwch"
import type { PlaygroundResult } from "@/types/playground"
import { contract } from "vowwch"

const SNIPPETS: Record<Mode, string> = {
  strict: `import { contract } from "vowwch"

const isPositive = (v: unknown): v is number =>
  typeof v === "number" && v > 0

const double = (n: number) => n * 2

const safeDouble = contract(double, {
  name: "double",
  input: isPositive,
  output: isPositive,
  mode: "strict",
})

console.log(safeDouble(5))

try {
  safeDouble(-1)
} catch (e) {
  console.error(e.message)
}`,

  warn: `import { contract } from "vowwch"

const isPositive = (v: unknown): v is number =>
  typeof v === "number" && v > 0

const double = (n: number) => n * 2

const safeDouble = contract(double, {
  name: "double",
  input: isPositive,
  output: isPositive,
  mode: "warn",
  onViolation: (v) => {
    console.warn(\`Violation: \${v.side} in "\${v.name}"\`)
  },
})

console.log("strict mode: throws on violation")
console.log("warn mode:   logs violation, continues")
console.log("silent mode: silently ignores violation\\n")

// warn — logs violation but does not throw
console.log(safeDouble(-1))
console.log("Execution continued after violation")`,

  silent: `import { contract } from "vowwch"

const isPositive = (v: unknown): v is number =>
  typeof v === "number" && v > 0

const double = (n: number) => n * 2

const safeDouble = contract(double, {
  name: "double",
  input: isPositive,
  output: isPositive,
  mode: "silent",
})

console.log("strict mode: throws on violation")
console.log("warn mode:   logs violation, continues")
console.log("silent mode: silently ignores violation\\n")

// silent — violation is swallowed entirely
console.log(safeDouble(-1))
console.log("No violation was reported")`,
}

export const usePlayground = () => {
  const code = shallowRef(SNIPPETS.strict)
  const mode = shallowRef<Mode>("strict")
  const result = shallowRef<PlaygroundResult | null>(null)
  const running = shallowRef(false)

  const updateMode = (m: Mode) => {
    mode.value = m
    code.value = SNIPPETS[m]
  }

  const run = (): PlaygroundResult => {
    running.value = true
    const selectedMode = mode.value
    const start = performance.now()
    let capturedViolation: Violation | null = null
    const logs: string[] = []
    const originalError = console.error

    console.error = (...args: unknown[]) => {
      const item = args[0]
      if (item != null && typeof item === "object" && "side" in item && "name" in item) {
        capturedViolation = item as Violation
      }
      logs.push(args.map(String).join(" "))
    }

    try {
      const isPositive = (v: unknown): v is number => typeof v === "number" && v > 0
      const isString = (v: unknown): v is string => typeof v === "string"

      const double = (n: number) => n * 2
      const greet = (name: string) => `Hello, ${name}!`

      const safeDouble = contract(double, {
        name: "double",
        input: isPositive,
        output: isPositive,
        mode: selectedMode,
        onViolation: (v) => {
          capturedViolation = v
          logs.push(`[violation] ${v.side} violation in "${v.name}"`)
        },
      })

      const safeGreet = contract(greet, {
        name: "greet",
        input: isString,
        output: isString,
        mode: selectedMode,
        onViolation: (v) => {
          capturedViolation = v
          logs.push(`[violation] ${v.side} violation in "${v.name}"`)
        },
      })

      void safeGreet

      let output: unknown
      try {
        output = safeDouble(5)
        logs.push(`safeDouble(5) = ${String(output)}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        logs.push(`safeDouble(5) threw: ${msg}`)
      }
      try {
        output = safeDouble(-1)
        logs.push(`safeDouble(-1) = ${String(output)}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        logs.push(`safeDouble(-1) threw: ${msg}`)
      }

      const duration = performance.now() - start
      const playgroundResult: PlaygroundResult = {
        output: logs.join("\n"),
        violation: capturedViolation,
        error: null,
        duration,
      }
      result.value = playgroundResult
      return playgroundResult
    } catch (err) {
      const duration = performance.now() - start
      const errorMsg = err instanceof Error ? err.message : String(err)
      const playgroundResult: PlaygroundResult = {
        output: logs.join("\n"),
        violation: capturedViolation,
        error: errorMsg,
        duration,
      }
      result.value = playgroundResult
      return playgroundResult
    } finally {
      console.error = originalError
      running.value = false
    }
  }

  const reset = () => {
    code.value = SNIPPETS.strict
    result.value = null
    mode.value = "strict"
  }

  return { code, mode, result, running, run, reset, updateMode }
}
