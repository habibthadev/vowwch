<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { ref, inject, onUnmounted, computed } from "vue"

const props = defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  highlights?: number[]
  meta?: string | null
}>()

const copied = ref(false)

const copy = async (code?: string) => {
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {}
}

const group = inject<{
  activeIndex: { value: number }
  register: (label: string) => symbol
  unregister: (key: symbol) => void
  getIndex: (key: symbol) => number
} | null>("code-group", null)

const groupKey = group && props.filename ? group.register(props.filename) : null
const tabIndex =
  groupKey !== null && group ? computed(() => group.getIndex(groupKey)) : computed(() => -1)
const isActive = group
  ? computed(() => tabIndex.value === group.activeIndex.value)
  : computed(() => true)

onUnmounted(() => {
  if (groupKey && group) group.unregister(groupKey)
})
</script>

<template>
  <div
    v-show="isActive"
    class="code-block group relative"
    :class="group ? 'in-group' : 'rounded-lg overflow-hidden border'"
  >
    <div v-if="filename && !group" class="flex items-center bg-muted px-4 py-1.5">
      <span class="font-mono text-xs text-muted-foreground/70">{{ filename }}</span>
    </div>
    <button
      class="absolute right-2.5 z-10 inline-flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-accent hover:text-foreground group-hover:opacity-100"
      :class="filename && !group ? 'top-[calc(0.625rem+1.625rem)]' : 'top-2.5'"
      :aria-label="copied ? 'Copied' : 'Copy code'"
      @click="copy(code)"
    >
      <Icon v-if="!copied" icon="lucide:copy" :width="13" aria-hidden="true" />
      <Icon v-else icon="lucide:check" :width="13" aria-hidden="true" />
    </button>
    <slot />
  </div>
</template>

<style scoped>
pre {
  margin: 0 !important;
  border-radius: var(--radius-md, 0.5rem);
}
.code-block:has(> div:first-child) pre,
.code-block.in-group pre {
  border-radius: 0 0 var(--radius-md, 0.5rem) var(--radius-md, 0.5rem);
}
.code-block.in-group pre {
  /* padding-top: 0.25rem; */
}
pre code .line {
  display: block;
}
</style>
