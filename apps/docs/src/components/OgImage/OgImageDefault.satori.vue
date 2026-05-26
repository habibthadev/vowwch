<script setup lang="ts">
defineProps({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
})
</script>

<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #0a0a0a;
      position: relative;
      overflow: hidden;
    "
  >
    <div
      style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          radial-gradient(
            ellipse 80% 60% at 10% 90%,
            rgba(148, 163, 184, 0.12) 0%,
            transparent 60%
          ),
          radial-gradient(ellipse 60% 50% at 90% 10%, rgba(148, 163, 184, 0.08) 0%, transparent 50%);
      "
    />
    <div
      style="
        display: flex;
        flex-direction: column;
        padding: 64px;
        flex: 1;
        justify-content: center;
        position: relative;
      "
    >
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px">
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 8px;
            background-color: #1a1a1a;
            border: 1px solid #2a2a2a;
          "
        >
          <span
            style="
              font-family: &quot;JetBrains Mono&quot;, monospace;
              font-size: 24px;
              font-weight: 600;
              color: #94a3b8;
            "
          >
            { v }
          </span>
        </div>
        <span
          style="
            font-family: &quot;Geist&quot;, sans-serif;
            font-size: 28px;
            font-weight: 500;
            color: #64748b;
            letter-spacing: -0.02em;
          "
        >
          vowwch
        </span>
      </div>
      <h1
        style="
          font-family: &quot;Geist&quot;, sans-serif;
          font-size: 72px;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
          max-width: 90%;
        "
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        style="
          font-family: &quot;Geist&quot;, sans-serif;
          font-size: 32px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.4;
          letter-spacing: -0.01em;
          margin: 0;
          max-width: 85%;
        "
      >
        {{ description }}
      </p>
    </div>
    <div
      style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #334155 0%, #94a3b8 50%, #334155 100%);
      "
    />
  </div>
</template>
