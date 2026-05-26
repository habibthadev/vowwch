<script setup lang="ts">
import { ref, reactive, provide, onUnmounted } from "vue"

const activeIndex = ref(0)
const tabs = reactive<string[]>([])

const labels = new Map<symbol, string>()

provide("code-group", {
  activeIndex,
  register(label: string): symbol {
    const key = Symbol()
    labels.set(key, label)
    tabs.push(label)
    return key
  },
  unregister(key: symbol) {
    const idx = tabs.indexOf(labels.get(key) ?? "")
    if (idx >= 0) tabs.splice(idx, 1)
    labels.delete(key)
  },
  getIndex(key: symbol): number {
    const label = labels.get(key)
    return label ? tabs.indexOf(label) : -1
  },
})
</script>

<template>
  <div class="overflow-hidden rounded-lg border">
    <div class="flex bg-muted px-4">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        class="relative -mb-px px-3 py-1.5 text-xs font-mono transition-colors duration-100"
        :class="
          i === activeIndex
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground/80'
        "
        @click="activeIndex = i"
      >
        {{ tab }}
        <span
          v-if="i === activeIndex"
          class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground"
        />
      </button>
    </div>
    <slot />
  </div>
</template>
