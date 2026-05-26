<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  url?: string
}>()
</script>

<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      width: 1200px;
      height: 630px;
      background-color: #0a0a09;
      padding: 72px 80px;
      justify-content: space-between;
    "
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <span style="font-family: JetBrains Mono; font-size: 14px; color: #71717a">
        {{ url || "vowwch.vercel.app" }}
      </span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 18px">
      <div
        style="
          font-family: Geist;
          font-size: 56px;
          font-weight: 700;
          color: #fafafa;
          line-height: 1.15;
          max-width: 900px;
          letter-spacing: -0.03em;
        "
      >
        {{ title || "Runtime contracts\nfor any JavaScript function" }}
      </div>
      <div
        v-if="description"
        style="
          font-family: Geist;
          font-size: 24px;
          color: #a1a1aa;
          line-height: 1.5;
          max-width: 800px;
        "
      >
        {{ description }}
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 16px">
      <div style="width: 32px; height: 3px; background-color: #52525b; flex-shrink: 0" />
      <span style="font-family: JetBrains Mono; font-size: 13px; color: #71717a">
        Zero dependencies &middot; Runtime predicates &middot; TypeScript
      </span>
    </div>
  </div>
</template>
