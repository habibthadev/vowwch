<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue"
import { Icon } from "@iconify/vue"

defineProps<{
  mode: "strict" | "warn" | "silent"
  running: boolean
}>()

defineEmits<{
  run: []
  reset: []
  "update:mode": [mode: "strict" | "warn" | "silent"]
}>()

const modes = ["strict", "warn", "silent"] as const
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="relative flex items-center rounded-lg bg-muted p-0.5">
      <button
        v-for="m in modes"
        :key="m"
        class="relative z-10 rounded-md px-3 py-1.5 font-mono text-xs transition-all duration-150"
        :class="
          mode === m
            ? 'bg-background font-medium text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="$emit('update:mode', m)"
      >
        {{ m }}
      </button>
    </div>
    <Button size="sm" :disabled="running" class="gap-1.5" @click="$emit('run')">
      <Icon icon="lucide:play" :width="12" aria-hidden="true" />
      Run
    </Button>
    <Button variant="ghost" size="sm" @click="$emit('reset')"> Reset </Button>
  </div>
</template>
