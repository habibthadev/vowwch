import { Hono } from "hono"
import pino from "pino"
import { createContractor } from "vowwch"
import type { Violation } from "vowwch"

const logger = pino({ name: "api" })

const contractor = createContractor({
  mode: "warn",
  onViolation: (violation: Violation) => {
    logger.error(
      {
        contract: violation.name,
        side: violation.side,
        actual: violation.actual,
      },
      "contract violation",
    )
  },
})

const isString = (v: unknown): v is string => typeof v === "string"
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object"

const getUser = (id: string): Record<string, unknown> => ({
  id,
  name: "Alice",
  email: "alice@example.com",
})

const listUsers = (): string[] => ["alice", "bob", "charlie"]

const safeGetUser = contractor.contract(getUser, {
  name: "getUser",
  input: isString,
  output: isObject,
})

const safeListUsers = contractor.contract(listUsers, {
  name: "listUsers",
  output: (v: unknown): v is string[] => Array.isArray(v),
})

const app = new Hono()

app.get("/users/:id", (c) => {
  const user = safeGetUser(c.req.param("id"))
  return c.json(user)
})

app.get("/users", (c) => {
  const users = safeListUsers()
  return c.json(users)
})

const run = async () => {
  const res = await app.request("/users/42")
  console.log("GET /users/42:", res.status, await res.json())

  const res2 = await app.request("/users")
  console.log("GET /users:", res2.status, await res2.json())
}

void run()
