<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { docsNavigation } from "@/utils/navigation"
import { watch } from "vue"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const isActive = (href: string) => route.path === href || route.path === href + "/"

watch(
  () => route.path,
  () => emit("close"),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="props.open"
        class="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        @click="emit('close')"
      />
    </Transition>
    <Transition name="drawer">
      <nav
        v-if="props.open"
        class="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto overscroll-contain border-r bg-background px-5 py-5 sm:px-6 sm:py-6"
        aria-label="Mobile navigation"
      >
        <div class="mb-6 flex items-center justify-between">
          <NuxtLink
            to="/"
            class="font-mono text-sm font-semibold tracking-tight"
            @click="emit('close')"
          >
            <span class="text-muted-foreground/50">{</span> v
            <span class="text-muted-foreground/50">}</span>
          </NuxtLink>
          <button
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
            @click="emit('close')"
          >
            <Icon icon="lucide:x" :width="16" aria-hidden="true" />
          </button>
        </div>

        <div v-for="section in docsNavigation" :key="section.title" class="mb-5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {{ section.title }}
          </p>
          <ul class="space-y-px">
            <li v-for="item in section.items" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="block rounded-md px-2.5 py-2 text-sm transition-colors duration-150"
                :class="
                  isActive(item.href)
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                "
                @click="emit('close')"
              >
                {{ item.title }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="border-t pt-4">
          <ul class="space-y-px">
            <li>
              <NuxtLink
                to="/playground"
                class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors duration-150"
                :class="
                  isActive('/playground')
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                "
                @click="emit('close')"
              >
                <Icon
                  icon="lucide:terminal"
                  :width="14"
                  class="shrink-0 opacity-60"
                  aria-hidden="true"
                />
                Playground
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/changelog"
                class="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors duration-150"
                :class="
                  isActive('/changelog')
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                "
                @click="emit('close')"
              >
                <Icon
                  icon="lucide:file-text"
                  :width="14"
                  class="shrink-0 opacity-60"
                  aria-hidden="true"
                />
                Changelog
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 200ms ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.drawer-enter-active {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-leave-active {
  transition: transform 200ms ease-in;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}
</style>
