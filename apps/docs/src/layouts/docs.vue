<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue"
import AppFooter from "@/components/layout/AppFooter.vue"
import AppSidebar from "@/components/layout/AppSidebar.vue"
import DocsSearch from "@/components/docs/DocsSearch.vue"
import DocsTableOfContents from "@/components/docs/DocsTableOfContents.vue"
import MobileNav from "@/components/layout/MobileNav.vue"
import { useToc } from "@/composables/useToc"
import { ref } from "vue"

const mobileNavOpen = ref(false)
const tocLinks = useToc()
</script>

<template>
  <div class="flex min-h-[100dvh] flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:text-sm"
    >
      Skip to content
    </a>
    <AppHeader @open-menu="mobileNavOpen = true" />
    <div class="mx-auto flex w-full max-w-[90rem] flex-1">
      <AppSidebar />
      <main
        id="main"
        class="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:border-x lg:px-12 lg:py-10 xl:px-16"
      >
        <slot />
      </main>
      <aside
        class="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[12rem] shrink-0 overflow-y-auto overscroll-contain py-8 pl-4 pr-6 xl:block"
      >
        <DocsTableOfContents :links="tocLinks" />
      </aside>
    </div>
    <AppFooter />
    <DocsSearch />
    <MobileNav :open="mobileNavOpen" @close="mobileNavOpen = false" />
  </div>
</template>
