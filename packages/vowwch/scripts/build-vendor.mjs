import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const srcDir = resolve(root, "src")
const pkgJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"))

function stripImports(content) {
  return content
    .replace(/^import\s+.*from\s+"@\/.*"\s*\n?/gm, "")
    .replace(/^import\s+type\s+.*from\s+"@\/.*"\s*\n?/gm, "")
    .replace(/^export\s+\{[^}]*\}\s+from\s+"@\/.*"\s*\n?/gm, "")
    .replace(/^export\s+type\s+\{[^}]*\}\s+from\s+"@\/.*"\s*\n?/gm, "")
    .trim()
}

const files = ["types.ts", "internals.ts", "guard.ts", "contract.ts", "contractor.ts", "batch.ts"]
const sourceBlocks = files.map((file) => stripImports(readFileSync(resolve(srcDir, file), "utf-8")))

const header = `/**
 * @module vowwch
 * @version ${pkgJson.version}
 * @license MIT
 * @see https://github.com/habibthadev/vowwch
 *
 * Zero-dependency runtime contracts for any JavaScript function.
 * This is the vendorable single-file distribution. Paste it in and own it.
 */
`

const output = header + "\n" + sourceBlocks.join("\n\n") + "\n"
const outPath = resolve(root, "vowwch.ts")
writeFileSync(outPath, output, "utf-8")
