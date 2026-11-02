/**
 * Smoothly scrolls to a section by element id or anchor hash.
 */
export const scrollToSection = (target: string) => {
  const id = target.replace(/^#/, '')
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Smoothly scrolls to the top of the window.
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
