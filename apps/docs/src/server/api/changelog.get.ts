import { readFileSync } from "node:fs"
import { resolve } from "node:path"

export default defineEventHandler(() => {
  const root = resolve(process.cwd(), "../../CHANGELOG.md")
  const fallback = resolve(process.cwd(), "CHANGELOG.md")

  try {
    return readFileSync(root, "utf-8")
  } catch {
    try {
      return readFileSync(fallback, "utf-8")
    } catch {
      return ""
    }
  }
})
