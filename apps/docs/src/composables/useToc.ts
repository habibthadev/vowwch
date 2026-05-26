import type { TocItem } from "@/types/docs"

export const useToc = () => useState<TocItem[]>("toc-links", () => [])
