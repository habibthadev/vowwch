<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue"
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "radix-vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  open?: boolean
  class?: HTMLAttributes["class"]
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
}>()

const forwarded = computed(() => ({
  open: props.open,
  "onUpdate:open": (val: boolean) => emit("update:open", val),
}))
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
