<script setup lang="ts">
import AppHeader from "@/components/layout/AppHeader.vue"
import AppFooter from "@/components/layout/AppFooter.vue"
import DocsSearch from "@/components/docs/DocsSearch.vue"
import MobileNav from "@/components/layout/MobileNav.vue"
import { ref } from "vue"

const mobileNavOpen = ref(false)
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
    <main id="main" class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <DocsSearch />
    <MobileNav :open="mobileNavOpen" @close="mobileNavOpen = false" />
  </div>
</template>
