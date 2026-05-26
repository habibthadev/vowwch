<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { findAdjacentPages } from "@/utils/navigation"
import { computed } from "vue"

const route = useRoute()
const adjacent = computed(() => findAdjacentPages(route.path))
</script>

<template>
  <div class="mt-12 border-t pt-6 sm:mt-16 sm:pt-8">
    <nav
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Page navigation"
    >
      <NuxtLink
        v-if="adjacent.prev"
        :to="adjacent.prev.href"
        class="group flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm text-muted-foreground transition-all duration-150 hover:border-foreground/20 hover:text-foreground sm:max-w-[45%]"
      >
        <Icon
          icon="lucide:arrow-left"
          :width="14"
          class="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-xs text-muted-foreground/60">Previous</p>
          <p class="truncate font-medium">{{ adjacent.prev.title }}</p>
        </div>
      </NuxtLink>
      <span v-else />
      <NuxtLink
        v-if="adjacent.next"
        :to="adjacent.next.href"
        class="group flex items-center justify-end gap-2.5 rounded-lg border px-4 py-3 text-sm text-muted-foreground transition-all duration-150 hover:border-foreground/20 hover:text-foreground sm:ml-auto sm:max-w-[45%]"
      >
        <div class="min-w-0 text-right">
          <p class="text-xs text-muted-foreground/60">Next</p>
          <p class="truncate font-medium">{{ adjacent.next.title }}</p>
        </div>
        <Icon
          icon="lucide:arrow-right"
          :width="14"
          class="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </NuxtLink>
    </nav>
    <div class="mt-6 flex items-center justify-center border-t pt-5 sm:justify-start">
      <a
        :href="`https://github.com/habibthadev/vowwch/edit/main/apps/docs/src/content/docs/${route.params.slug ? (Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug) : 'introduction'}.md`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors duration-150 hover:text-muted-foreground"
      >
        <Icon icon="lucide:pen-line" :width="12" aria-hidden="true" />
        Edit this page on GitHub
      </a>
    </div>
  </div>
</template>
