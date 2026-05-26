import { contract, defineGuard } from "vowwch"

interface Post {
  id: number
  title: string
  content: string
  published: boolean
}

const isPost = defineGuard<Post>((value: unknown) => {
  if (value === null || typeof value !== "object") throw new Error("expected object")
  const obj = value as Record<string, unknown>
  if (typeof obj.id !== "number") throw new Error("id must be number")
  if (typeof obj.title !== "string") throw new Error("title must be string")
  if (typeof obj.content !== "string") throw new Error("content must be string")
  if (typeof obj.published !== "boolean") throw new Error("published must be boolean")
  return value as Post
})

const isPostArray = (v: unknown): v is Post[] => Array.isArray(v) && v.every((item) => isPost(item))

const findManyPosts = async (): Promise<Post[]> => [
  { id: 1, title: "Hello", content: "World", published: true },
  { id: 2, title: "Draft", content: "WIP", published: false },
]

const findPostById = async (id: number): Promise<Post> => ({
  id,
  title: "Hello",
  content: "World",
  published: true,
})

const safeFindMany = contract(findManyPosts, {
  name: "Post.findMany",
  output: isPostArray,
  mode: "strict",
})

const safeFindById = contract(findPostById, {
  name: "Post.findById",
  input: (v: unknown): v is number => typeof v === "number" && v > 0,
  output: isPost,
  mode: "strict",
})

const main = async () => {
  const posts = await safeFindMany()
  console.log("Found posts:", posts.length)

  const post = await safeFindById(1)
  console.log("Found post:", post.title)

  try {
    await safeFindById(-1)
  } catch (err: unknown) {
    console.log("Caught:", (err as Error).message)
  }
}

void main()
