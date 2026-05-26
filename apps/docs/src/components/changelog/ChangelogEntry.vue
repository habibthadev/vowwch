<template>
  <div class="border-t py-6 first:border-t-0 sm:py-8">
    <div class="flex items-baseline gap-3">
      <h3 class="font-mono text-sm font-semibold text-foreground">{{ version }}</h3>
      <time v-if="date" class="text-xs text-muted-foreground/70">{{ date }}</time>
    </div>
    <div class="mt-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ version: string; date?: string }>()
</script>
