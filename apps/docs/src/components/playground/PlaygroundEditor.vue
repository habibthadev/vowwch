<script setup lang="ts">
import { computed, ref } from "vue"
import { Icon } from "@iconify/vue"

const props = defineProps<{ modelValue: string }>()
const copied = ref(false)

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {}
}

const lineCount = computed(() => Math.max(props.modelValue.split("\n").length, 10))
const lines = computed(() => Array.from({ length: lineCount.value }, (_, i) => i + 1))

const highlighted = computed(() => highlight(props.modelValue))

function highlight(code: string): string {
  const html = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const tokens: { text: string; type?: string }[] = []
  let i = 0

  while (i < html.length) {
    const rest = html.slice(i)
    let m: RegExpMatchArray | null

    if ((m = rest.match(/^\/\*[\s\S]*?\*\//))) {
      tokens.push({ text: m[0], type: "syn-comment" })
      i += m[0].length
      continue
    }

    if ((m = rest.match(/^\/\/.*/))) {
      tokens.push({ text: m[0], type: "syn-comment" })
      i += m[0].length
      continue
    }

    if ((m = rest.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/))) {
      tokens.push({ text: m[1], type: "syn-string" })
      i += m[0].length
      continue
    }

    if ((m = rest.match(/^\b(\d+(?:\.\d+)?)\b/))) {
      tokens.push({ text: m[1], type: "syn-number" })
      i += m[0].length
      continue
    }

    if (
      (m = rest.match(
        /^(import|from|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|void|try|catch|finally|throw|async|await|yield|class|extends|implements|interface|type|enum|as|in|of|keyof|readonly|static|private|protected|public|abstract|declare|export|default|true|false|null|undefined|this|super)\b/,
      ))
    ) {
      tokens.push({ text: m[1], type: "syn-keyword" })
      i += m[0].length
      continue
    }

    if (
      (m = rest.match(
        /^(console|Math|JSON|Promise|Array|Object|Map|Set|Error|String|Number|Boolean|Symbol)\b(?!\s*\()/,
      ))
    ) {
      tokens.push({ text: m[1], type: "syn-builtin" })
      i += m[0].length
      continue
    }

    if ((m = rest.match(/^([A-Z][a-zA-Z0-9]+)(?=\s*[<(])/))) {
      tokens.push({ text: m[1], type: "syn-type" })
      i += m[0].length
      continue
    }

    tokens.push({ text: html[i] })
    i++
  }

  return tokens.map((t) => (t.type ? `<span class="${t.type}">${t.text}</span>` : t.text)).join("")
}
</script>

<template>
  <div class="group relative flex h-full overflow-hidden rounded-lg border bg-card">
    <div
      class="flex w-10 shrink-0 flex-col items-end border-r bg-muted/30 px-2 py-3 font-mono text-[11px] leading-[1.625rem] text-muted-foreground/40 select-none"
      aria-hidden="true"
    >
      <span v-for="n in lines" :key="n">{{ n }}</span>
    </div>
    <pre
      class="flex-1 overflow-auto p-3 font-mono text-[13px] leading-[1.625rem] focus:outline-none"
      tabindex="0"
    ><code v-html="highlighted" /></pre>
    <button
      class="absolute right-2.5 top-2.5 z-10 inline-flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-accent hover:text-foreground group-hover:opacity-100"
      :aria-label="copied ? 'Copied' : 'Copy code'"
      @click="copy"
    >
      <Icon v-if="!copied" icon="lucide:copy" :width="13" aria-hidden="true" />
      <Icon v-else icon="lucide:check" :width="13" aria-hidden="true" />
    </button>
  </div>
</template>
