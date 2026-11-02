import { useEffect, useState, type RefObject } from 'react'
import { viewportOnce } from './motion'

/**
 * framer-motion's `whileInView` and `useInView` construct an
 * IntersectionObserver without checking for one, which throws on the server
 * and in jsdom. Everything that reacts to the viewport goes through here
 * instead, and without an observer the content simply renders in its final
 * state.
 */
export const canObserve =
  typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined'

export const useInViewport = (
  ref: RefObject<Element | null>,
  { once = false, margin = '0px', amount = 0 }: { once?: boolean; margin?: string; amount?: number } = {}
) => {
  const [inView, setInView] = useState(!canObserve)

  useEffect(() => {
    const element = ref.current
    if (!element || !canObserve) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin: margin, threshold: amount }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, once, margin, amount])

  return inView
}

/** Props for a variant-driven reveal; renders straight to `show` when it cannot observe. */
export const revealProps = (once = true) =>
  canObserve
    ? ({
        initial: 'hidden',
        whileInView: 'show',
        viewport: once ? viewportOnce : { ...viewportOnce, once: false },
      } as const)
    : ({ initial: false, animate: 'show' } as const)
