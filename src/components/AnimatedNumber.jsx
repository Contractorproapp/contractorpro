import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Smoothly counts up to `value` over `duration` ms.
 * Respects prefers-reduced-motion (jumps straight to value).
 *
 * @param {number} value      target number
 * @param {number} duration   ms (default 700)
 * @param {(n:number)=>string} format  format function (e.g. n => `$${Math.round(n)}`)
 */
export default function AnimatedNumber({ value = 0, duration = 700, format = (n) => Math.round(n).toLocaleString() }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const startRef = useRef(null)
  const fromRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduce) { setDisplay(value); return }
    fromRef.current = display
    startRef.current = null

    const tick = (t) => {
      if (startRef.current == null) startRef.current = t
      const elapsed = t - startRef.current
      const p = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(fromRef.current + (value - fromRef.current) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce])

  return <>{format(display)}</>
}
