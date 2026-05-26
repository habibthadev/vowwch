<script setup lang="ts">
import type { TocItem } from "@/types/docs"
import { ref, onMounted, onUnmounted, watch } from "vue"

const props = defineProps<{ links?: TocItem[] }>()
const activeId = ref("")

let observer: IntersectionObserver | null = null

const observe = () => {
  if (!props.links?.length) return
  observer?.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
          break
        }
      }
    },
    { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
  )

  for (const link of props.links) {
    const el = document.getElementById(link.id)
    if (el) observer.observe(el)
  }
}

onMounted(observe)
watch(() => props.links, observe, { deep: true })
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div v-if="links?.length">
    <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
      On this page
    </p>
    <ul class="space-y-1">
      <li v-for="link in links" :key="link.id">
        <a
          :href="`#${link.id}`"
          class="block py-0.5 text-[13px] leading-relaxed transition-colors duration-150"
          :class="[
            activeId === link.id
              ? 'font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground',
            link.depth === 3 ? 'pl-3' : '',
          ]"
        >
          {{ link.text }}
        </a>
      </li>
    </ul>
  </div>
</template>
