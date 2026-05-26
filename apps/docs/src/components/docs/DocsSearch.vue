<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { useSearch } from "@/composables/useSearch"
import { computed, ref, watch, nextTick } from "vue"

const { isOpen, close, query, results, ready } = useSearch()
const selectedIndex = ref(0)
const listRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
watch(query, () => {
  selectedIndex.value = 0
})

watch(isOpen, (open) => {
  if (open) nextTick(() => inputRef.value?.focus())
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    close()
    return
  }
  const len = results.value.length
  if (!len) return
  if (e.key === "ArrowDown") {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % len
    scrollIntoView()
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + len) % len
    scrollIntoView()
  }
}

const navigateTo = (href: string) => {
  useRouter().push(href)
  close()
}

const scrollIntoView = () => {
  nextTick(() => {
    const el = listRef.value?.querySelector("[data-selected]")
    el?.scrollIntoView({ block: "nearest" })
  })
}

function formatBreadcrumb(result: { section: string; pageTitle: string; title: string }): string {
  const parts = [result.section, result.pageTitle]
  return parts.join(" > ")
}

function renderSnippet(text: string, queryStr: string): string {
  let html = text.replace(/`([^`]+)`/g, '<code class="search-code-chip">$1</code>')
  if (queryStr) {
    const escaped = queryStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    html = html.replace(regex, "<mark>$1</mark>")
  }
  return html
}
</script>

<template>
  <Teleport to="body">
    <Transition name="search-overlay">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        @click="close"
      />
    </Transition>
    <Transition name="search-dialog">
      <div
        v-if="isOpen"
        class="fixed inset-x-0 top-[10vh] z-50 mx-auto w-full max-w-[94vw] px-0 sm:top-[12vh] sm:max-w-2xl sm:px-4"
      >
        <div
          class="overflow-hidden rounded-xl border bg-popover shadow-2xl"
          @keydown="handleKeydown"
        >
          <div class="relative flex items-center">
            <Icon
              icon="lucide:search"
              :width="16"
              class="pointer-events-none absolute left-4 shrink-0 text-muted-foreground/40"
              aria-hidden="true"
            />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search documentation..."
              class="h-12 w-full bg-transparent pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <kbd
              class="absolute right-3 rounded-full border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground/60"
              >Esc</kbd
            >
          </div>

          <div v-if="!ready" class="px-6 py-12 text-center text-sm text-muted-foreground">
            Loading search index...
          </div>

          <div
            v-else-if="query && results.length"
            ref="listRef"
            class="flex flex-col gap-2 px-4 py-4 max-h-[55vh] overflow-y-auto overscroll-contain"
          >
            <template v-for="(item, i) in results" :key="item.href">
              <button
                class="flex w-full flex-col gap-0.5 rounded-lg px-3 py-3 text-left text-sm transition-colors duration-100"
                :class="i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'"
                :data-selected="i === selectedIndex ? '' : undefined"
                @click="navigateTo(item.href)"
              >
                <span class="text-[11px] text-muted-foreground/60">{{
                  formatBreadcrumb(item)
                }}</span>
                <span class="font-semibold text-foreground">{{ item.title }}</span>
                <span
                  v-if="item.excerpt"
                  class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                  v-html="renderSnippet(item.excerpt, query)"
                ></span>
              </button>
            </template>
          </div>

          <div v-else-if="query" class="px-6 py-12 text-center text-sm text-muted-foreground">
            <Icon
              icon="lucide:search-x"
              :width="20"
              class="mx-auto mb-2 text-muted-foreground/40"
              aria-hidden="true"
            />
            No results for "{{ query }}"
          </div>

          <div v-else class="px-6 py-12 text-center text-sm text-muted-foreground/50">
            <Icon
              icon="lucide:search"
              :width="20"
              class="mx-auto mb-2 text-muted-foreground/30"
              aria-hidden="true"
            />
            Type to search...
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay-enter-active,
.search-overlay-leave-active {
  transition: opacity 150ms ease;
}
.search-overlay-enter-from,
.search-overlay-leave-to {
  opacity: 0;
}
.search-dialog-enter-active {
  transition:
    opacity 150ms ease,
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.search-dialog-leave-active {
  transition:
    opacity 100ms ease,
    transform 100ms ease-in;
}
.search-dialog-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
.search-dialog-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

:deep(mark) {
  background: transparent;
  color: hsl(var(--foreground));
  font-weight: 500;
}

:deep(.search-code-chip) {
  font-family: var(
    --font-mono,
    ui-monospace,
    SFMono-Regular,
    "SF Mono",
    Menlo,
    Consolas,
    monospace
  );
  font-size: 0.75rem;
  background: hsl(var(--muted));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}
</style>
