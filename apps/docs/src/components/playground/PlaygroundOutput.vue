<script setup lang="ts">
import type { PlaygroundResult } from "@/types/playground"
import { Icon } from "@iconify/vue"
import { useCopyCode } from "@/composables/useCopyCode"

defineProps<{ result: PlaygroundResult | null; running: boolean }>()

const { copied, copy } = useCopyCode()
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
    <div class="flex items-center justify-between border-b px-4 py-2.5">
      <span class="font-mono text-xs text-muted-foreground">Output</span>
      <button
        v-if="result?.output"
        class="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:text-foreground"
        :aria-label="copied ? 'Copied' : 'Copy output'"
        @click="copy(result!.output)"
      >
        <Icon v-if="copied" icon="lucide:check" :width="13" aria-hidden="true" />
        <Icon v-else icon="lucide:copy" :width="13" aria-hidden="true" />
      </button>
    </div>
    <div class="flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed">
      <div v-if="running" class="flex items-center gap-2 text-muted-foreground">
        <Icon icon="lucide:loader-2" :width="14" class="animate-spin" aria-hidden="true" />
        Running...
      </div>
      <template v-else-if="result">
        <pre v-if="result.error" class="whitespace-pre-wrap text-red-400">{{ result.error }}</pre>
        <pre v-else class="whitespace-pre-wrap text-foreground/85">{{
          result.output || "No output"
        }}</pre>
      </template>
      <p v-else class="text-muted-foreground/50">Run code to see output</p>
    </div>
  </div>
</template>
