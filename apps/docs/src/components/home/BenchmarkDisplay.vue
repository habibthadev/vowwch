<script setup lang="ts">
const stats = [
  { value: "900b", label: "Gzipped bundle", detail: "Single file, tree-shakeable" },
  { value: "<1ms", label: "Cold start", detail: "Zero dependencies to resolve" },
  { value: "~0.3μs", label: "Contract overhead", detail: "Per-call wrapping cost" },
  { value: "44", label: "Tests passing", detail: "100% coverage on every export" },
]
</script>

<template>
  <section class="border-b">
    <div class="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 md:py-24">
      <div class="mb-10 max-w-lg sm:mb-12">
        <p
          class="mb-2.5 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground/60"
        >
          Performance
        </p>
        <h2 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
          Built for production hot paths.
        </h2>
        <p class="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
          No allocation per call. No dependency graph. Just predicate checks on the way in and out.
        </p>
      </div>
      <div
        class="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4"
      >
        <div
          v-for="item in stats"
          :key="item.label"
          class="bg-background px-4 py-5 sm:px-6 sm:py-6"
        >
          <p
            class="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl"
          >
            {{ item.value }}
          </p>
          <p class="mt-1.5 text-xs font-medium text-foreground/70 sm:text-sm">{{ item.label }}</p>
          <p class="mt-0.5 text-[11px] text-muted-foreground/60 sm:text-xs">{{ item.detail }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
