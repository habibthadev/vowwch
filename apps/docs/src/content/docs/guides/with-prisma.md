---
title: With Prisma
description: Validate Prisma query results with runtime contracts to catch schema drift and data inconsistencies.
---

Prisma generates a type-safe client, but types only exist at compile time. The actual data returned from your database is only as correct as the database state. Runtime contracts catch mismatches caused by schema drift, raw queries, JSON columns, and manual database edits.

## Why validate database results

TypeScript trusts Prisma's generated types, but that breaks when a migration hasn't reached the database, a raw SQL query bypasses type generation, a JSON column drifted, or another service modified rows directly.

## Validating query results

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string(),
  published: z.boolean(),
  createdAt: z.date(),
})

type Post = z.infer<typeof PostSchema>

const isPost = defineGuard((v) => PostSchema.parse(v))

const findPost = contract(
  async (id: string): Promise<Post> => {
    return db.post.findUniqueOrThrow({ where: { id } })
  },
  {
    name: "findPost",
    output: isPost,
    mode: "warn",
  },
)
```

## Validating before writes

Guard inputs before they reach the database to catch invalid data early.

```ts
import { contract, defineGuard } from "vowwch"
import { z } from "zod"

const CreatePostInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  authorId: z.string().uuid(),
  tags: z.array(z.string().min(1)).max(10).default([]),
})

type CreatePostInput = z.infer<typeof CreatePostInputSchema>

const isCreatePostInput = defineGuard((v) => CreatePostInputSchema.parse(v))

const createPost = contract(
  async (input: CreatePostInput) => {
    return db.post.create({
      data: {
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        tags: input.tags,
        published: false,
      },
    })
  },
  { name: "createPost", input: isCreatePostInput, mode: "strict" },
)
```

## Repository layer with contracts

Use `createContractor` to share mode and violation handling across all queries.

```ts
import { createContractor, defineGuard, type Violation } from "vowwch"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const { contract: dbContract } = createContractor({
  mode: process.env.NODE_ENV === "production" ? "warn" : "strict",
  onViolation: (v: Violation) => {
    console.error(
      JSON.stringify({ layer: "db", contract: v.name, side: v.side, parserError: v.parserError }),
    )
  },
})

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
})

const isUser = defineGuard((v) => UserSchema.parse(v))

const findUser = dbContract(async (id: string) => db.user.findUniqueOrThrow({ where: { id } }), {
  name: "UserRepo.findById",
  output: isUser,
})
```

## Batch validation for findMany

Use `batch` to validate each record from `findMany`. Invalid records are filtered out in `warn` mode.

```ts
import { batch, defineGuard, type Violation } from "vowwch"
import { z } from "zod"

const PublishablePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(100),
  authorId: z.string().uuid(),
})

const isPublishablePost = defineGuard((v) => PublishablePostSchema.parse(v))

const publishDrafts = batch(
  async (posts: z.infer<typeof PublishablePostSchema>[]) => {
    const ids = posts.map((p) => p.id)
    await db.post.updateMany({ where: { id: { in: ids } }, data: { published: true } })
    return { published: ids.length, ids }
  },
  {
    name: "publishDrafts",
    item: isPublishablePost,
    mode: "warn",
    onViolation: (v: Violation) => {
      console.error(`Skipping index ${v.itemIndex}: ${v.parserError}`)
    },
  },
)

const drafts = await db.post.findMany({ where: { published: false } })
const result = await publishDrafts(drafts)
```

## Handling nullable relations

Prisma returns `null` for optional relations. Account for this in your predicates.

```ts
import { defineGuard, contract } from "vowwch"
import { z } from "zod"

const ProfileSchema = z.object({
  bio: z.string(),
  avatarUrl: z.string().url(),
})

const UserWithProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  profile: ProfileSchema.nullable(),
})

const isUserWithProfile = defineGuard((v) => UserWithProfileSchema.parse(v))

const findUserWithProfile = contract(
  async (id: string) => {
    return db.user.findUniqueOrThrow({ where: { id }, include: { profile: true } })
  },
  { name: "findUserWithProfile", output: isUserWithProfile, mode: "warn" },
)
```

## JSON column validation

JSON columns are the most common source of runtime shape violations. Prisma types them as `JsonValue` with no structural guarantees.

```ts
import { defineGuard, contract } from "vowwch"
import { z } from "zod"

const SettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    frequency: z.enum(["immediate", "daily", "weekly"]),
  }),
  locale: z.string().length(2),
})

const isSettings = defineGuard((v) => SettingsSchema.parse(v))

const getUserSettings = contract(
  async (userId: string) => {
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { settings: true },
    })
    return user.settings
  },
  { name: "getUserSettings", output: isSettings, mode: "strict" },
)
```
