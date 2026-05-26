<script setup lang="ts">
import { type HTMLAttributes, computed } from "vue"
import { ToggleGroupRoot, ToggleGroupItem } from "radix-vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  modelValue?: string
  type?: "single" | "multiple"
  class?: HTMLAttributes["class"]
  items: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const forwarded = computed(() => ({
  type: (props.type ?? "single") as "single",
  modelValue: props.modelValue,
  "onUpdate:modelValue": (val: string) => emit("update:modelValue", val),
}))
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    :class="
      cn(
        'inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        props.class,
      )
    "
  >
    <ToggleGroupItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :class="
        cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow',
        )
      "
    >
      {{ item.label }}
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
