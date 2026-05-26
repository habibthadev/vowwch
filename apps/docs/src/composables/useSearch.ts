import { shallowRef, watch } from "vue"
import { create, insert, search } from "@orama/orama"
import type { SearchResult } from "@/types/docs"

const schema = {
  title: "string",
  excerpt: "string",
  content: "string",
  section: "string",
  href: "string",
  pageTitle: "string",
} as const
type OramaInstance = ReturnType<typeof create<{ schema: typeof schema }>>

const db: OramaInstance = create({ schema })

const query = shallowRef("")
const isOpen = shallowRef(false)
const ready = shallowRef(false)
const results = shallowRef<SearchResult[]>([])

const sectionMap: Record<string, string> = {
  introduction: "Getting Started",
  installation: "Getting Started",
  "quick-start": "Getting Started",
  "concepts/why-vowwch": "Concepts",
  "concepts/interior-boundaries": "Concepts",
  "concepts/vendor-model": "Concepts",
  "api/contract": "API Reference",
  "api/create-contractor": "API Reference",
  "api/define-guard": "API Reference",
  "api/batch": "API Reference",
  "api/violation": "API Reference",
  "api/mode": "API Reference",
  "guides/with-zod": "Guides",
  "guides/with-hono": "Guides",
  "guides/with-prisma": "Guides",
  "guides/edge-runtime": "Guides",
  "guides/production-setup": "Guides",
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === "text" && typeof node.value === "string") {
    return node.value
  }
  if (node.type === "inlineCode" && typeof node.value === "string") {
    return "`" + node.value + "`"
  }
  if (Array.isArray(node.children)) {
    return node.children.map((c: Record<string, unknown>) => extractText(c)).join(" ")
  }
  if (typeof node.value === "string") {
    return node.value
  }
  return ""
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function splitPageIntoSections(
  doc: Record<string, unknown>,
  baseSection: string,
  basePath: string,
) {
  const pageTitle = (doc.title as string) ?? ""
  const children = (doc.body as Record<string, unknown>)?.children as
    | Record<string, unknown>[]
    | undefined
  if (!children || children.length === 0) {
    return [
      {
        title: pageTitle,
        excerpt: (doc.description as string) ?? "",
        content: "",
        section: baseSection,
        href: basePath,
        pageTitle,
      },
    ]
  }

  const sections: Array<{
    title: string
    excerpt: string
    content: string
    section: string
    href: string
    pageTitle: string
  }> = []
  let beforeFirstHeading: string[] = []
  let currentHeading: { text: string; id: string; content: string[] } | null = null

  for (const child of children) {
    const tag = child.tag as string
    if (/^h[1-6]$/.test(tag)) {
      if (currentHeading) {
        const content = currentHeading.content.join(" ").trim()
        sections.push({
          title: currentHeading.text,
          excerpt: content.slice(0, 160),
          content,
          section: baseSection,
          href: `${basePath}#${currentHeading.id}`,
          pageTitle,
        })
      } else if (beforeFirstHeading.length > 0) {
        const content = beforeFirstHeading.join(" ").trim()
        sections.push({
          title: (doc.title as string) ?? "",
          excerpt: content.slice(0, 160),
          content,
          section: baseSection,
          href: basePath,
          pageTitle,
        })
        beforeFirstHeading = []
      }
      const text = extractText(child)
      currentHeading = { text, id: slugify(text), content: [] }
    } else if (currentHeading) {
      currentHeading.content.push(extractText(child))
    } else {
      beforeFirstHeading.push(extractText(child))
    }
  }

  if (currentHeading) {
    const content = currentHeading.content.join(" ").trim()
    sections.push({
      title: currentHeading.text,
      excerpt: content.slice(0, 160),
      content,
      section: baseSection,
      href: `${basePath}#${currentHeading.id}`,
      pageTitle,
    })
  } else {
    const content = beforeFirstHeading.join(" ").trim()
    sections.push({
      title: (doc.title as string) ?? "",
      excerpt: (doc.description as string) || content.slice(0, 160),
      content,
      section: baseSection,
      href: basePath,
      pageTitle,
    })
  }

  return sections
}

let loaded = false
let pendingTerm = ""

async function buildIndex() {
  try {
    const res = await $fetch<Record<string, unknown> | Record<string, unknown>[]>(
      "/api/_content/query",
      {
        params: { _params: JSON.stringify({ where: [{ _path: { $regex: "/docs" } }] }) },
      },
    )
    const raw = Array.isArray(res) ? res : res.result
    const docs = raw as Record<string, unknown>[]
    for (const doc of docs) {
      const filePath = ((doc._file as string) ?? "").replace(/\.md$/, "").replace(/^docs\//, "")
      const section = sectionMap[filePath] ?? "Docs"
      const href = (doc._path as string) ?? `/docs/${filePath}`
      const subsections = splitPageIntoSections(doc, section, href)
      for (const sub of subsections) {
        await insert(db, sub)
      }
    }
    loaded = true
    ready.value = true
    if (pendingTerm) doSearch(pendingTerm)
  } catch (err) {
    console.error("[search] failed to build index:", err)
    loaded = true
    ready.value = true
  }
}

if (import.meta.client === true) {
  void buildIndex()
}

function doSearch(term: string) {
  const result = search(db, {
    term,
    properties: ["title", "excerpt", "content", "section", "pageTitle"],
    tolerance: 1,
    limit: 20,
  })
  if (result instanceof Promise) {
    void result.then((r) => {
      results.value = r.hits.map(mapHit)
    })
    return
  }
  results.value = result.hits.map(mapHit)
}

function mapHit(hit: { document: Record<string, unknown> }): SearchResult {
  const doc = hit.document as {
    title: string
    excerpt: string
    href: string
    section: string
    pageTitle: string
  }
  return {
    title: doc.title,
    excerpt: doc.excerpt?.slice(0, 160) || doc.section,
    href: doc.href,
    section: doc.section,
    pageTitle: doc.pageTitle,
  }
}

watch(query, (q) => {
  const term = q.trim()
  if (!term) {
    results.value = []
    return
  }
  if (!loaded) {
    pendingTerm = term
    return
  }
  doSearch(term)
})

export const useSearch = () => {
  const open = () => {
    isOpen.value = true
  }
  const close = () => {
    isOpen.value = false
    query.value = ""
  }

  return { query, results, isOpen, ready, open, close }
}
