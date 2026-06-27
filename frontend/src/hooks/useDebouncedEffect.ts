import { useEffect, useRef } from 'react'

export function useDebouncedEffect(effect: () => void, deps: unknown[], delayMs: number) {
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const timer = window.setTimeout(effect, delayMs)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
