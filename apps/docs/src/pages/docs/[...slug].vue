<script setup lang="ts">
import { Icon } from "@iconify/vue"
import DocsBreadcrumb from "@/components/docs/DocsBreadcrumb.vue"
import DocsPager from "@/components/docs/DocsPager.vue"
import DocsTableOfContents from "@/components/docs/DocsTableOfContents.vue"
import { useToc } from "@/composables/useToc"
import { ref, watch } from "vue"

definePageMeta({ layout: "docs" })

const route = useRoute()
const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? s.join("/") : s
})

const { data: page } = await useAsyncData(`docs-${slug.value}`, () =>
  queryContent("docs", slug.value).findOne(),
)

const tocLinks = useToc()
watch(
  () => page.value?.body?.toc?.links,
  (links) => {
    tocLinks.value = links || []
  },
  { immediate: true },
)

useHead({
  title: computed(() => (page.value?.title ? `${page.value.title} - vowwch` : "vowwch")),
  meta: computed(() => [
    {
      name: "description",
      content: page.value?.description ?? "Runtime contracts for any JavaScript function.",
    },
  ]),
})

const mobileTocOpen = ref(false)
const copyState = ref<"idle" | "copied">("idle")

const nodeToMd = (node: Element, depth = 0): string => {
  const tag = node.tagName?.toLowerCase() ?? ""
  const children = Array.from(node.childNodes)
    .map((c) => {
      if (c.nodeType === 3) return c.textContent ?? ""
      if (c.nodeType === 1) return nodeToMd(c as Element, depth)
      return ""
    })
    .join("")

  if (tag === "h2") return `\n## ${children.trim()}\n`
  if (tag === "h3") return `\n### ${children.trim()}\n`
  if (tag === "h4") return `\n#### ${children.trim()}\n`
  if (tag === "p") return `\n${children.trim()}\n`
  if (tag === "pre") {
    const code = node.querySelector("code")
    return `\n\`\`\`\n${(code?.textContent ?? children).trim()}\n\`\`\`\n`
  }
  if (tag === "code" && node.parentElement?.tagName?.toLowerCase() !== "pre")
    return `\`${children}\``
  if (tag === "strong" || tag === "b") return `**${children}**`
  if (tag === "em" || tag === "i") return `*${children}*`
  if (tag === "a") return `[${children}](${node.getAttribute("href") ?? ""})`
  if (tag === "ul") return `\n${children}`
  if (tag === "ol") return `\n${children}`
  if (tag === "li") return `- ${children.trim()}\n`
  if (tag === "blockquote") return `\n> ${children.trim()}\n`
  if (tag === "table") return `\n${children}\n`
  if (tag === "tr")
    return `| ${Array.from(node.children)
      .map((c) => (c.textContent ?? "").trim())
      .join(" | ")} |\n`
  if (tag === "thead") {
    const hRow = children
    const cols = node.querySelector("tr")?.children.length ?? 0
    return `${hRow}|${Array.from({ length: cols }, () => " --- ").join("|")}|\n`
  }
  if (tag === "hr") return `\n---\n`
  return children
}

const copyPage = async () => {
  if (!page.value) return
  const el = document.getElementById("doc-content")
  if (!el) return
  const proseEl = el.querySelector(".prose")
  if (!proseEl) return

  const title = `# ${page.value.title}`
  const desc = page.value.description ? `\n${page.value.description}\n` : ""
  const body = nodeToMd(proseEl as Element)

  try {
    await navigator.clipboard.writeText(`${title}\n${desc}${body}`.trim())
    copyState.value = "copied"
    setTimeout(() => {
      copyState.value = "idle"
    }, 2000)
  } catch {}
}

watch(
  () => route.path,
  () => {
    mobileTocOpen.value = false
  },
)
</script>

<template>
  <div v-if="page" class="max-w-[65ch]">
    <DocsBreadcrumb />
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {{ page.title }}
        </h1>
        <p
          v-if="page.description"
          class="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7"
        >
          {{ page.description }}
        </p>
      </div>
      <button
        class="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-[0.98]"
        :aria-label="copyState === 'copied' ? 'Copied' : 'Copy page as markdown'"
        @click="copyPage"
      >
        <Icon v-if="copyState === 'idle'" icon="lucide:copy" :width="13" aria-hidden="true" />
        <Icon v-else icon="lucide:check" :width="13" aria-hidden="true" />
        <span class="hidden sm:inline">{{ copyState === "copied" ? "Copied" : "Copy" }}</span>
      </button>
    </div>

    <div id="doc-content" class="mt-8 sm:mt-10">
      <ContentRenderer :value="page" class="prose prose-zinc dark:prose-invert max-w-none" />
    </div>
    <DocsPager />
  </div>
  <div v-else class="py-20 text-center">
    <p class="text-sm text-muted-foreground">Page not found.</p>
    <NuxtLink
      to="/docs/introduction"
      class="mt-4 inline-block text-sm text-foreground underline underline-offset-4"
    >
      Back to docs
    </NuxtLink>
  </div>

  <div v-if="tocLinks.length > 0" class="xl:hidden">
    <Teleport to="body">
      <Transition name="toc-overlay">
        <div
          v-if="mobileTocOpen"
          class="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          @click="mobileTocOpen = false"
        />
      </Transition>
      <Transition name="toc-panel">
        <div
          v-if="mobileTocOpen"
          class="fixed bottom-0 left-0 right-0 z-50 max-h-[60dvh] overflow-y-auto overscroll-contain rounded-t-xl border-t bg-background px-5 pb-8 pt-4 shadow-lg"
        >
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm font-semibold text-foreground">On this page</p>
            <button
              class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              aria-label="Close table of contents"
              @click="mobileTocOpen = false"
            >
              <Icon icon="lucide:x" :width="14" aria-hidden="true" />
            </button>
          </div>
          <DocsTableOfContents :links="tocLinks" />
        </div>
      </Transition>
      <button
        v-if="!mobileTocOpen && tocLinks.length > 0"
        class="fixed bottom-5 right-5 z-40 inline-flex size-10 items-center justify-center rounded-full border bg-background shadow-md transition-all duration-150 hover:bg-accent active:scale-[0.95]"
        aria-label="Open table of contents"
        @click="mobileTocOpen = true"
      >
        <Icon icon="lucide:list" :width="16" class="text-muted-foreground" aria-hidden="true" />
      </button>
    </Teleport>
  </div>
</template>

<style scoped>
.toc-overlay-enter-active,
.toc-overlay-leave-active {
  transition: opacity 200ms ease;
}
.toc-overlay-enter-from,
.toc-overlay-leave-to {
  opacity: 0;
}
.toc-panel-enter-active {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toc-panel-leave-active {
  transition: transform 200ms ease-in;
}
.toc-panel-enter-from,
.toc-panel-leave-to {
  transform: translateY(100%);
}
</style>
