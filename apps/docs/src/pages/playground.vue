<script setup lang="ts">
import PlaygroundEditor from "@/components/playground/PlaygroundEditor.vue"
import PlaygroundOutput from "@/components/playground/PlaygroundOutput.vue"
import PlaygroundControls from "@/components/playground/PlaygroundControls.vue"
import { usePlayground } from "@/composables/usePlayground"

definePageMeta({ layout: "default" })

const ogUrl = useRequestURL().hostname
defineOgImageComponent("OgImageDefault", {
  title: "Playground",
  description: "Experiment with vowwch contracts in the browser.",
  url: ogUrl,
})

const { code, mode, result, running, run, reset, updateMode } = usePlayground()
</script>

<template>
  <div class="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-10">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Playground</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Experiment with vowwch contracts in the browser.
        </p>
      </div>
      <PlaygroundControls
        :mode="mode"
        :running="running"
        @run="run"
        @reset="reset"
        @update:mode="updateMode"
      />
    </div>
    <div
      class="grid gap-4 lg:grid-cols-2"
      style="height: clamp(24rem, calc(100dvh - 14rem), 48rem)"
    >
      <PlaygroundEditor v-model="code" />
      <PlaygroundOutput :result="result" :running="running" />
    </div>
  </div>
</template>
