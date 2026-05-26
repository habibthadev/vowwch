<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { computed } from "vue"

const props = defineProps<{
  type?: "info" | "warning" | "danger"
  title?: string
}>()

const config = computed(() => {
  const map = {
    info: { icon: "lucide:info", border: "border-l-foreground/20", bg: "bg-muted/40" },
    warning: {
      icon: "lucide:triangle-alert",
      border: "border-l-amber-500/50 dark:border-l-amber-400/40",
      bg: "bg-amber-500/[0.04] dark:bg-amber-400/[0.06]",
    },
    danger: {
      icon: "lucide:circle-x",
      border: "border-l-red-500/50 dark:border-l-red-400/40",
      bg: "bg-red-500/[0.04] dark:bg-red-400/[0.06]",
    },
  }
  return map[props.type || "info"]
})
</script>

<template>
  <div :class="['my-6 rounded-r-lg border-l-2 p-4', config.border, config.bg]" role="note">
    <div v-if="title" class="mb-2 flex items-center gap-2">
      <Icon
        :icon="config.icon"
        :width="14"
        class="shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <p class="text-sm font-semibold text-foreground">{{ title }}</p>
    </div>
    <div class="text-sm leading-relaxed text-muted-foreground">
      <slot />
    </div>
  </div>
</template>
