export interface NavItem {
  title: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface TocItem {
  id: string
  text: string
  depth: number
}

export interface SearchResult {
  title: string
  excerpt: string
  href: string
  section: string
  pageTitle: string
}
