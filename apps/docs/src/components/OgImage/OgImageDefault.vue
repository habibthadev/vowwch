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
      background: #0a0a09;
      padding: 72px 80px;
      justify-content: space-between;
    "
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #161615;
          border: 1px solid #2a2a28;
          flex-shrink: 0;
        "
      >
        <span
          style="
            font-family: &quot;JetBrains Mono&quot;, monospace;
            font-size: 15px;
            font-weight: 600;
            color: #a0a09c;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          {v}
        </span>
      </div>
      <span
        style="
          font-family: &quot;Geist&quot;, sans-serif;
          font-size: 14px;
          color: #5a5a57;
          letter-spacing: 0.02em;
        "
      >
        {{ url || "vowwch.dev" }}
      </span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 18px">
      <div
        style="
          font-family: &quot;Geist&quot;, sans-serif;
          font-size: 54px;
          font-weight: 700;
          color: #f0f0ee;
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
          font-family: &quot;Geist&quot;, sans-serif;
          font-size: 22px;
          color: #9a9a95;
          line-height: 1.5;
          max-width: 800px;
          letter-spacing: -0.01em;
        "
      >
        {{ description }}
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 16px">
      <div
        style="width: 32px; height: 3px; background: #63635f; border-radius: 2px; flex-shrink: 0"
      />
      <span
        style="
          font-family: &quot;JetBrains Mono&quot;, monospace;
          font-size: 13px;
          color: #5a5a57;
          letter-spacing: 0.02em;
        "
      >
        Zero dependencies &middot; Runtime predicates &middot; TypeScript
      </span>
    </div>
  </div>
</template>
