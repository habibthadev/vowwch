<template>
  <footer class="border-t">
    <div
      class="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6"
    >
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/"
          class="font-mono text-sm font-medium tracking-tight text-foreground transition-opacity duration-150 hover:opacity-70"
        >
          <span class="text-muted-foreground">{</span>&nbsp;v&nbsp;<span
            class="text-muted-foreground"
            >}</span
          >
        </NuxtLink>
        <span class="hidden h-3.5 w-px bg-border sm:block" aria-hidden="true" />
        <p class="text-xs text-muted-foreground">MIT License</p>
      </div>
      <div class="flex items-center gap-4">
        <a
          href="https://github.com/habibthadev/vowwch"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          GitHub
        </a>
        <NuxtLink
          to="/docs/introduction"
          class="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          Documentation
        </NuxtLink>
        <NuxtLink
          to="/changelog"
          class="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          Changelog
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>
