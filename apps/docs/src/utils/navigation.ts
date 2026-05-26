import type { NavSection } from "@/types/docs"

export const docsNavigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Concepts",
    items: [
      { title: "Why vowwch", href: "/docs/concepts/why-vowwch" },
      { title: "Interior Boundaries", href: "/docs/concepts/interior-boundaries" },
      { title: "The Vendor Model", href: "/docs/concepts/vendor-model" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "contract()", href: "/docs/api/contract" },
      { title: "createContractor()", href: "/docs/api/create-contractor" },
      { title: "defineGuard()", href: "/docs/api/define-guard" },
      { title: "batch()", href: "/docs/api/batch" },
      { title: "Violation", href: "/docs/api/violation" },
      { title: "Mode", href: "/docs/api/mode" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "With Zod", href: "/docs/guides/with-zod" },
      { title: "With Hono", href: "/docs/guides/with-hono" },
      { title: "With Prisma", href: "/docs/guides/with-prisma" },
      { title: "Edge Runtime", href: "/docs/guides/edge-runtime" },
      { title: "Production Setup", href: "/docs/guides/production-setup" },
    ],
  },
]

export const flatNavItems = docsNavigation.flatMap((section) => section.items)

export const findAdjacentPages = (currentPath: string) => {
  const index = flatNavItems.findIndex((item) => item.href === currentPath)
  return {
    prev: index > 0 ? flatNavItems[index - 1] : null,
    next: index < flatNavItems.length - 1 ? flatNavItems[index + 1] : null,
  }
}
