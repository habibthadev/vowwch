<script setup lang="ts">
import { computed } from "vue"

definePageMeta({ layout: "default" })

const ogUrl = useRequestURL().hostname
defineOgImageComponent("OgImageDefault", {
  title: "Changelog",
  description: "All notable changes to vowwch.",
  url: ogUrl,
})

interface ChangelogRelease {
  version: string
  sections: Array<{ heading: string; items: string[] }>
}

const parseChangelog = (raw: string): ChangelogRelease[] => {
  const releases: ChangelogRelease[] = []
  let current: ChangelogRelease | null = null
  let currentSection: { heading: string; items: string[] } | null = null

  raw.split("\n").forEach((line) => {
    const versionMatch = line.match(/^## (.+)/)
    if (versionMatch) {
      current = { version: versionMatch[1].trim(), sections: [] }
      releases.push(current)
      currentSection = null
      return
    }

    const sectionMatch = line.match(/^### (.+)/)
    if (sectionMatch && current) {
      currentSection = { heading: sectionMatch[1].trim(), items: [] }
      current.sections.push(currentSection)
      return
    }

    const itemMatch = line.match(/^- (.+)/)
    if (itemMatch && current) {
      const target =
        currentSection ??
        (() => {
          const s = { heading: "Changes", items: [] as string[] }
          current!.sections.push(s)
          currentSection = s
          return s
        })()
      target.items.push(itemMatch[1].trim())
    }
  })

  return releases
}

const { data: changelogRaw } = await useFetch("/api/changelog")
const releases = computed(() => parseChangelog(changelogRaw.value ?? ""))
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
    <h1 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">
      Changelog
    </h1>
    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">All notable changes to vowwch.</p>
    <div class="mt-8 sm:mt-10">
      <div
        v-for="release in releases"
        :key="release.version"
        class="border-t py-6 first:border-t-0 sm:py-8"
      >
        <h3 class="font-mono text-sm font-semibold text-foreground">{{ release.version }}</h3>
        <div v-for="section in release.sections" :key="section.heading" class="mt-4">
          <h4 class="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            {{ section.heading }}
          </h4>
          <ul
            class="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground"
          >
            <li v-for="item in section.items" :key="item">
              <span v-html="formatItem(item)" />
            </li>
          </ul>
        </div>
      </div>
      <p v-if="!releases.length" class="text-sm text-muted-foreground">No releases yet.</p>
    </div>
  </div>
</template>

<script lang="ts">
const formatItem = (text: string): string =>
  text.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">$1</code>',
  )
</script>
