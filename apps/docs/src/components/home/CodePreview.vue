<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { useCopyCode } from "@/composables/useCopyCode"

defineProps<{
  filename?: string
  code: string
}>()

const { copied, copy } = useCopyCode()
</script>

<template>
  <div class="w-full min-w-0 overflow-hidden rounded-lg border bg-card">
    <div v-if="filename" class="flex items-center justify-between border-b px-4 py-2.5">
      <span class="font-mono text-xs text-muted-foreground/70">{{ filename }}</span>
      <button
        class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors duration-150 hover:bg-accent hover:text-foreground"
        :aria-label="copied ? 'Copied' : 'Copy code'"
        @click="copy(code)"
      >
        <Icon
          v-if="copied"
          icon="lucide:check"
          :width="13"
          class="text-emerald-500"
          aria-hidden="true"
        />
        <Icon v-else icon="lucide:copy" :width="13" aria-hidden="true" />
      </button>
    </div>
    <div class="overflow-x-auto p-4 sm:p-5">
      <pre
        class="font-mono text-xs leading-6 text-foreground/90 sm:text-[13px] sm:leading-7"
      ><code>{{ code }}</code></pre>
    </div>
  </div>
</template>
