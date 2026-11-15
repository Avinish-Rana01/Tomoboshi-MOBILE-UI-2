import { useEffect, useRef } from "react"

/** Keep keyboard focus in the active capture surface and restore it on close. */
export default function useCaptureDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    const siblings = Array.from(dialog.parentElement?.children ?? [])
      .filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node !== dialog,
      )
      .map((node) => ({ node, inert: node.inert }))
    siblings.forEach(({ node }) => {
      node.inert = true
    })
    document.body.style.overflow = "hidden"
    dialog.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current()
      if (event.key !== "Tab") return
      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
        ),
      ).filter((item) => item.getClientRects().length > 0)
      const first = items[0]
      const last = items[items.length - 1]
      if (!first) {
        event.preventDefault()
        dialog.focus()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener("keydown", onKey)
    return () => {
      dialog.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
      siblings.forEach(({ node, inert }) => {
        node.inert = inert
      })
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return ref
}
