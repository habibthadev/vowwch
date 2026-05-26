<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { useSearch } from "@/composables/useSearch"

const emit = defineEmits<{ "open-menu": [] }>()

const { open: openSearch } = useSearch()

const colorMode = useColorMode()
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
}

const links = [
  { label: "Docs", href: "/docs/introduction" },
  { label: "Playground", href: "/playground" },
  { label: "Changelog", href: "/changelog" },
]
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl backdrop-saturate-[1.8]"
  >
    <div class="mx-auto flex h-14 max-w-[90rem] items-center px-4 sm:px-6">
      <NuxtLink
        to="/"
        class="mr-6 flex items-center gap-1.5 text-sm tracking-tight text-foreground transition-opacity duration-150 hover:opacity-70"
      >
        <span class="font-mono font-semibold"
          ><span class="text-muted-foreground">{</span>&nbsp;v&nbsp;<span
            class="text-muted-foreground"
            >}</span
          ></span
        >
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
        <NuxtLink
          v-for="link in links"
          :key="link.href"
          :to="link.href"
          class="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          active-class="!text-foreground"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-0.5">
        <button
          class="hidden h-8 items-center gap-2 rounded-lg border bg-secondary/50 pl-3 pr-2 text-sm text-muted-foreground transition-all duration-150 hover:bg-secondary sm:w-40 md:flex md:w-56"
          @click="openSearch"
        >
          <Icon icon="lucide:search" :width="14" class="shrink-0 opacity-50" aria-hidden="true" />
          <span class="flex-1 text-left text-[13px]">Search...</span>
          <kbd
            class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70"
            >&#8984;K</kbd
          >
        </button>

        <button
          class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Search"
          @click="openSearch"
        >
          <Icon icon="lucide:search" :width="16" aria-hidden="true" />
        </button>

        <a
          href="https://github.com/habibthadev/vowwch"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          aria-label="GitHub repository"
        >
          <Icon icon="simple-icons:github" :width="16" aria-hidden="true" />
        </a>

        <button
          class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <Icon
            v-if="colorMode.value === 'dark'"
            icon="lucide:sun"
            :width="16"
            aria-hidden="true"
          />
          <Icon v-else icon="lucide:moon" :width="16" aria-hidden="true" />
        </button>

        <button
          class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
          @click="emit('open-menu')"
        >
          <Icon icon="lucide:menu" :width="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>
