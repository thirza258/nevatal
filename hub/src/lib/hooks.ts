import { useEffect, useState } from 'react'

/** `matchMedia` as state. False on the server and in jsdom, which lack it. */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

/** A mouse or trackpad. Dragging is only offered here: on touch it would steal the scroll. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

export const useWide = () => useMediaQuery('(min-width: 768px)')
