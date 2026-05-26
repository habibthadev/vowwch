process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1"
process.env.PLAYWRIGHT_BROWSERS_PATH = "0"

import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  srcDir: "src",
  ssr: true,
  compatibilityDate: "2025-04-17",

  nitro: {
    preset: "vercel-static",
  },

  modules: ["@nuxt/content", "@nuxtjs/color-mode", "@vueuse/nuxt", "nuxt-og-image"],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/tailwind.css"],

  content: {
    highlight: {
      theme: {
        dark: "github-dark",
        light: "github-light",
      },
      langs: ["typescript", "javascript", "bash", "json", "yaml", "vue"],
    },
    documentDriven: false,
  },

  colorMode: {
    classSuffix: "",
    preference: "dark",
    fallback: "dark",
    storageKey: "vowwch-theme",
  },

  shadcn: {
    prefix: "",
    componentDir: "src/components/ui",
  },

  alias: {
    "@": "~/",
  },

  ogImage: {
    runtimeCacheStorage: false,
    compatibility: {
      prerender: {
        chromium: false,
      },
    },
    defaults: {
      width: 1200,
      height: 630,
    },
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: "vowwch",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Runtime contracts for any JavaScript function. Zero dependencies.",
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "preconnect", href: "https://cdn.jsdelivr.net", crossorigin: "" },
        {
          rel: "preload",
          as: "style",
          href: "https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-sans/style.css",
        },
        {
          rel: "preload",
          as: "style",
          href: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/index.css",
        },
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-sans/style.css",
        },
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/index.css",
        },
      ],
    },
  },
})
