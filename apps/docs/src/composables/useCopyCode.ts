import { shallowRef } from "vue"

export const useCopyCode = () => {
  const copied = shallowRef(false)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  return { copied, copy }
}
