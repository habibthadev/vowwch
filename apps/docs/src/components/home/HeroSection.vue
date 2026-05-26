<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue"
import { Icon } from "@iconify/vue"
import { ref, onMounted } from "vue"

const copied = ref(false)

const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText("npm install vowwch")
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {}
}

const visible = ref(false)
onMounted(() => {
  visible.value = true
})
</script>

<template>
  <section class="relative overflow-hidden border-b">
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--foreground)/0.02)_0%,_transparent_70%)]"
      aria-hidden="true"
    />
    <div
      class="relative mx-auto max-w-[90rem] px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 md:pb-28 md:pt-32 lg:pb-32 lg:pt-36"
    >
      <div class="mx-auto max-w-2xl text-center lg:max-w-3xl">
        <div
          class="transition-all duration-700 ease-out"
          :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
        >
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:mb-6">
            <span class="h-1.5 w-1.5 rounded-full bg-foreground/50" aria-hidden="true" />
            <span class="text-xs font-medium text-muted-foreground sm:text-[13px]"
              >Runtime contracts for TypeScript</span
            >
          </div>
        </div>

        <h1
          class="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-foreground transition-all delay-100 duration-700 ease-out sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
          :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          Validate at every boundary.<br class="hidden sm:block" />
          Ship with certainty.
        </h1>

        <p
          class="mx-auto mt-4 max-w-[52ch] text-sm leading-relaxed text-muted-foreground transition-all delay-200 duration-700 ease-out sm:mt-5 sm:text-base sm:leading-7 md:text-lg md:leading-8"
          :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          Zero-dependency runtime contracts that wrap any function with input and output predicates.
          Catch violations before they propagate.
        </p>

        <div
          class="mt-7 flex flex-col items-center gap-3 transition-all delay-300 duration-700 ease-out sm:mt-8 sm:flex-row sm:justify-center sm:gap-3"
          :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          <NuxtLink to="/docs/introduction">
            <Button size="lg" class="w-full gap-2 sm:w-auto">
              Get started
              <Icon icon="lucide:arrow-right" :width="14" aria-hidden="true" />
            </Button>
          </NuxtLink>
          <button
            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-card px-4 font-mono text-sm text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground active:scale-[0.98] sm:w-auto"
            @click="copyInstall"
          >
            <span class="text-muted-foreground/60">$</span>
            <span>npm install vowwch</span>
            <Icon
              v-if="!copied"
              icon="lucide:copy"
              :width="13"
              class="ml-1 opacity-50"
              aria-hidden="true"
            />
            <Icon v-else icon="lucide:check" :width="13" class="ml-1" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        class="mx-auto mt-12 max-w-xl transition-all delay-[400ms] duration-700 ease-out sm:mt-16 lg:mt-20"
        :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
      >
        <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div class="flex items-center justify-between border-b px-4 py-2">
            <span class="font-mono text-xs text-muted-foreground/70">contract.ts</span>
            <div class="flex gap-1" aria-hidden="true">
              <span class="size-2 rounded-full bg-border" />
              <span class="size-2 rounded-full bg-border" />
              <span class="size-2 rounded-full bg-border" />
            </div>
          </div>
          <div class="overflow-x-auto p-4 sm:p-5">
            <pre
              class="font-mono text-xs leading-6 text-foreground/90 sm:text-[13px] sm:leading-7"
            ><code><span class="text-muted-foreground">import</span> { contract } <span class="text-muted-foreground">from</span> <span class="text-emerald-500 dark:text-emerald-400">"vowwch"</span>

<span class="text-muted-foreground">const</span> safeParse = contract(JSON.parse, {
  input: (raw) =&gt; <span class="text-muted-foreground">typeof</span> raw === <span class="text-emerald-500 dark:text-emerald-400">"string"</span>,
  output: (val) =&gt; val !== <span class="text-muted-foreground">null</span>,
})

safeParse(<span class="text-emerald-500 dark:text-emerald-400">'{"ok": true}'</span>)  <span class="text-muted-foreground/50">// ✓ passes</span>
safeParse(<span class="text-amber-500 dark:text-amber-400">42</span>)              <span class="text-muted-foreground/50">// ✗ input violation</span></code></pre>
          </div>
        </div>
      </div>

      <div
        class="mx-auto mt-10 flex max-w-xl justify-center transition-all delay-500 duration-700 ease-out sm:mt-14"
        :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
      >
        <div class="grid grid-cols-3 divide-x">
          <div class="px-5 text-center sm:px-8">
            <p class="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              0
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">dependencies</p>
          </div>
          <div class="px-5 text-center sm:px-8">
            <p class="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              ~900b
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">gzipped</p>
          </div>
          <div class="px-5 text-center sm:px-8">
            <p class="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              100%
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">test coverage</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
