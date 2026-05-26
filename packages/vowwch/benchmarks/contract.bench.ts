import { Bench } from "tinybench"
import { contract, batch, defineGuard } from "../src/index.js"

const isNumber = (v: unknown): v is number => typeof v === "number"

const add = (a: number, b: number) => a + b
const wrappedAdd = contract(add, {
  name: "add",
  input: [isNumber, isNumber],
  output: isNumber,
  mode: "strict",
})
const silentAdd = contract(add, {
  name: "add",
  input: [isNumber, isNumber],
  output: isNumber,
  mode: "silent",
})
const asyncAdd = (a: number, b: number): Promise<number> => Promise.resolve(a + b)
const wrappedAsyncAdd = contract(asyncAdd, {
  name: "asyncAdd",
  input: [isNumber, isNumber],
  output: isNumber,
  mode: "strict",
})

const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)
const wrappedBatch = batch(sum, {
  name: "sum",
  item: isNumber,
  mode: "strict",
})
const batchItems = Array.from({ length: 1000 }, (_, i) => i)

const guard = defineGuard((v: unknown) => {
  if (typeof v !== "number") throw new Error("not a number")
  return v
})

const suite = new Bench({ iterations: 1000, time: 200 })

suite
  .add("unwrapped baseline", () => {
    add(1, 2)
  })
  .add("contract sync valid", () => {
    wrappedAdd(1, 2)
  })
  .add("contract silent mode", () => {
    silentAdd(1, 2)
  })
  .add("contract async valid", async () => {
    await wrappedAsyncAdd(1, 2)
  })
  .add("batch 1000 valid items", () => {
    wrappedBatch(batchItems)
  })
  .add("defineGuard predicate", () => {
    guard(42)
  })

await suite.run()

const results = suite.tasks.map((task) => {
  const r = task.result
  if (r.state !== "completed") return { name: task.name }
  return {
    name: task.name,
    "ops/sec": Math.round(r.throughput.mean),
    "avg (ns)": Math.round(r.latency.mean * 1e6),
    "p99 (ns)": Math.round(r.latency.p99 * 1e6),
    samples: r.latency.df + 1,
  }
})
console.error(results)
