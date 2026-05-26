import { useColorMode } from "@vueuse/core"
import { computed } from "vue"

export const useTheme = () => {
  const mode = useColorMode({
    attribute: "class",
    modes: {
      light: "light",
      dark: "dark",
    },
    storageKey: "vowwch-theme",
    initialValue: "dark",
  })

  const isDark = computed(() => mode.value === "dark")

  const toggleTheme = () => {
    mode.value = isDark.value ? "light" : "dark"
  }

  return { theme: mode, toggleTheme, isDark }
}
