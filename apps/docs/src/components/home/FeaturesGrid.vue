<script setup lang="ts">
import { Icon } from "@iconify/vue"

const features = [
  {
    icon: "lucide:shield",
    title: "contract()",
    description:
      "Wrap any function with input and output predicates. Violations are caught before they cross module boundaries.",
  },
  {
    icon: "lucide:factory",
    title: "createContractor()",
    description:
      "Build a factory with shared defaults. Apply the same mode, guards, and violation handler to every contract in a module.",
  },
  {
    icon: "lucide:scan",
    title: "defineGuard()",
    description:
      "Turn any throwing parser into a boolean predicate. Name it, describe it, reuse it across contracts.",
  },
  {
    icon: "lucide:layers",
    title: "batch()",
    description:
      "Validate every item in an array with per-element predicates. Invalid items are caught individually, not as a whole.",
  },
  {
    icon: "lucide:settings-2",
    title: "Three modes",
    description:
      "strict throws on violation, warn logs and continues, silent skips all checks. Switch per environment with zero code changes.",
  },
  {
    icon: "lucide:package",
    title: "Zero dependencies",
    description:
      "Single file. No runtime dependencies. Works in Node, Deno, Bun, Cloudflare Workers, and the browser.",
  },
]
</script>

<template>
  <section class="border-b">
    <div class="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 md:py-24">
      <div class="mb-10 max-w-lg sm:mb-12">
        <p
          class="mb-2.5 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground/60"
        >
          API Surface
        </p>
        <h2 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
          Everything you need. Nothing you don't.
        </h2>
        <p class="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
          Six exports. Full runtime safety. No abstractions to learn.
        </p>
      </div>
      <div class="grid gap-0 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="border-t py-6 sm:py-7"
          :class="[
            i % 2 === 1 ? 'md:border-l md:pl-8 lg:border-l-0 lg:pl-0' : 'md:pr-8 lg:pr-0',
            i % 3 === 1 ? 'lg:border-l lg:px-8' : '',
            i % 3 === 2 ? 'lg:border-l lg:pl-8' : '',
            i % 3 === 0 ? 'lg:pr-8' : '',
          ]"
        >
          <div class="mb-2.5 flex items-center gap-2.5">
            <Icon
              :icon="feature.icon"
              :width="15"
              class="shrink-0 text-muted-foreground/50"
              aria-hidden="true"
            />
            <h3 class="font-mono text-sm font-medium text-foreground">{{ feature.title }}</h3>
          </div>
          <p class="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
