<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { docsNavigation, flatNavItems } from "@/utils/navigation"
import { computed } from "vue"

const route = useRoute()

const crumbs = computed(() => {
  const current = flatNavItems.find(
    (item) => route.path === item.href || route.path === item.href + "/",
  )
  if (!current) return []

  const section = docsNavigation.find((s) => s.items.some((i) => i.href === current.href))

  const result = [{ label: "Docs", href: "/docs/introduction" }]
  if (section) result.push({ label: section.title, href: section.items[0].href })
  if (!section || section.items[0].href !== current.href) {
    result.push({ label: current.title, href: current.href })
  }
  return result
})
</script>

<template>
  <nav
    v-if="crumbs.length"
    class="mb-4 flex items-center gap-1.5 text-[13px] sm:mb-6"
    aria-label="Breadcrumb"
  >
    <template v-for="(crumb, i) in crumbs" :key="crumb.href">
      <Icon
        v-if="i > 0"
        icon="lucide:chevron-right"
        :width="11"
        class="text-muted-foreground/40"
        aria-hidden="true"
      />
      <NuxtLink
        :to="crumb.href"
        class="truncate transition-colors duration-150"
        :class="
          i === crumbs.length - 1
            ? 'font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
      >
        {{ crumb.label }}
      </NuxtLink>
    </template>
  </nav>
</template>
