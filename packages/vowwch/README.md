# vowwch

Zero-dependency runtime contracts for any JavaScript function.

```ts
import { contract } from "vowwch"

const double = contract((n: number) => n * 2, {
  name: "double",
  input: (v: unknown): v is number => typeof v === "number",
  mode: "strict",
})

double(5) // 10
double("bad" as any) // throws VowwchViolationError
```

- **Zero dependencies** — No transitive supply chain risk
- **Single-file vendorable** — `curl` it into your project and own the source
- **Predicate-based** — `(value: unknown) => value is T` — no schema DSL to learn
- **Three modes** — `strict` (throw), `warn` (log), `silent` (zero cost)

## Install

```bash
npm install vowwch
```

## Docs

Full documentation at [vowwch.vercel.app](https://vowwch.vercel.app)

## License

MIT
