<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue"
import { type BadgeVariants, badgeVariants } from "."
import { cn } from "@/lib/utils"

const props = defineProps<{
  variant?: BadgeVariants["variant"]
  class?: HTMLAttributes["class"]
}>()

const badgeClass = computed(() => cn(badgeVariants({ variant: props.variant }), props.class))
</script>

<template>
  <div :class="badgeClass">
    <slot />
  </div>
</template>
