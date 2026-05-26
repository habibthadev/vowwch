<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { docsNavigation } from "@/utils/navigation"

const route = useRoute()
const isActive = (href: string) => route.path === href || route.path === href + "/"

const bottomLinks = [
  { label: "Playground", href: "/playground", icon: "lucide:terminal" },
  { label: "Changelog", href: "/changelog", icon: "lucide:file-text" },
]
</script>

<template>
  <aside
    class="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[13rem] shrink-0 overflow-y-auto overscroll-contain lg:block"
  >
    <nav aria-label="Documentation" class="flex h-full flex-col py-8 pl-6 pr-3">
      <div class="flex-1">
        <div v-for="section in docsNavigation" :key="section.title" class="mb-5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {{ section.title }}
          </p>
          <ul class="space-y-0.5">
            <li v-for="item in section.items" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="block rounded-md px-2.5 py-[5px] text-sm transition-colors duration-150"
                :class="
                  isActive(item.href)
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                "
              >
                {{ item.title }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t pt-4">
        <ul class="space-y-0.5">
          <li v-for="link in bottomLinks" :key="link.href">
            <NuxtLink
              :to="link.href"
              class="flex items-center gap-2 rounded-md px-2.5 py-[5px] text-sm transition-colors duration-150"
              :class="
                isActive(link.href)
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              "
            >
              <Icon :icon="link.icon" :width="14" class="shrink-0 opacity-60" aria-hidden="true" />
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
