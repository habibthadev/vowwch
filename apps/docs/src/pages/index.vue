<script setup lang="ts">
import HeroSection from "@/components/home/HeroSection.vue"
import FeaturesGrid from "@/components/home/FeaturesGrid.vue"
import BenchmarkDisplay from "@/components/home/BenchmarkDisplay.vue"
import Button from "@/components/ui/button/Button.vue"
import { Icon } from "@iconify/vue"

definePageMeta({ layout: "default" })
</script>

<template>
  <div>
    <HeroSection />
    <FeaturesGrid />
    <BenchmarkDisplay />
    <section class="border-b">
      <div class="mx-auto max-w-[90rem] px-4 py-16 sm:px-6 md:py-24 lg:py-28">
        <div class="mx-auto max-w-md text-center lg:max-w-lg">
          <h2 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
            Start guarding your boundaries.
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
            Install vowwch and add runtime contracts in under a minute.
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink to="/docs/installation">
              <Button size="lg" class="w-full gap-2 sm:w-auto">
                Install
                <Icon icon="lucide:arrow-right" :width="14" aria-hidden="true" />
              </Button>
            </NuxtLink>
            <a
              href="https://github.com/habibthadev/vowwch"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" class="w-full gap-2 sm:w-auto">
                <Icon icon="simple-icons:github" :width="14" aria-hidden="true" />
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
