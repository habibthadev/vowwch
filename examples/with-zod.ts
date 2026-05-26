import { z } from "zod"
import { defineGuard, contract } from "vowwch"

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
})

type User = z.infer<typeof UserSchema>

const isUser = defineGuard<User>((value) => UserSchema.parse(value))

const createUser = (input: unknown): User => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: String((input as Record<string, unknown>).name),
  email: String((input as Record<string, unknown>).email),
})

const safeCreateUser = contract(createUser, {
  name: "createUser",
  input: isUser,
  output: isUser,
  mode: "strict",
})

const validInput = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Alice",
  email: "alice@example.com",
}

const result = safeCreateUser(validInput)
console.log("Created user:", result)

try {
  safeCreateUser({ id: "bad", name: "", email: "not-an-email" })
} catch (err: unknown) {
  console.log("Caught violation:", (err as Error).message)
}
