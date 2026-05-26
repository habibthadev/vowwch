<script setup lang="ts">
const ogUrl = useRequestURL().hostname
defineOgImageComponent("OgImageDefault", {
  title: "vowwch",
  description: "Runtime contracts for any JavaScript function. Zero dependencies.",
  url: ogUrl,
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
