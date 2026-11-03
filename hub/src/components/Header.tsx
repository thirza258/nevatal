import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { AI_HUB_URL, NAV_LINKS } from '../lib/constants'
import { easeOut, spring } from '../lib/motion'
import ShapeField from './decor/ShapeField'
import LogoMark from './LogoMark'
import Magnetic from './motion/Magnetic'
import { ArrowUpRight, Close, Menu } from './icons'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const { pathname } = useLocation()
  const { scrollY } = useScroll()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Out of the way while reading down the page, back as soon as you scroll up.
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(latest > 24)
    if (latest < 160) setHidden(false)
    else if (latest > previous + 12) setHidden(true)
    else if (latest < previous - 12) setHidden(false)
  })

  const concealed = hidden && !isOpen

  // Sticky bars further down the page read this to sit just below the header.
  useEffect(() => {
    document.documentElement.style.setProperty('--header-offset', concealed ? '12px' : '80px')
  }, [concealed])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <div className="relative z-[60] bg-sun text-ink">
        <div className="container-x flex h-9 min-w-0 items-center justify-center gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] sm:justify-between sm:text-[10.5px] sm:tracking-[0.16em]">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-2 w-2 flex-none" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-ink/40" />
              <span className="relative h-2 w-2 rounded-full bg-ink" />
            </span>
            <span className="truncate sm:hidden">Nevatal AI Hub is live — 17 tools</span>
            <span className="hidden truncate sm:inline">Nevatal AI Hub is live — seventeen tools, your own key</span>
          </span>
          <a
            href={AI_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hidden items-center gap-1 sm:inline-flex"
          >
            Open the workspace <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <motion.header
        className="pointer-events-none sticky top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        initial={false}
        animate={{ y: concealed ? -96 : 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        onFocusCapture={() => setHidden(false)}
      >
        <nav
          aria-label="Main"
          className={`pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border bg-paper/85 px-2 backdrop-blur-xl transition-[box-shadow,border-color] duration-300 ${
            scrolled
              ? 'border-ink/10 shadow-[0_20px_44px_-26px_rgba(11,11,13,0.45)]'
              : 'border-ink/[0.07]'
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 rounded-full pr-2" aria-label="Nevatal home">
            <motion.span whileHover={{ rotate: 360 }} transition={{ duration: 0.9, ease: easeOut }}>
              <LogoMark />
            </motion.span>
            <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">Nevatal</span>
          </Link>

          <ul className="hidden items-center gap-1 text-sm md:flex" onMouseLeave={() => setHovered(null)}>
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="relative" onMouseEnter={() => setHovered(link.to)}>
                {hovered === link.to && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 rounded-full bg-ink/[0.06]"
                    transition={spring}
                  />
                )}
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `relative block rounded-full px-4 py-2 transition-colors ${
                      isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute bottom-1 left-[calc(50%-3px)] h-1.5 w-1.5 rounded-full bg-cobalt"
                          transition={spring}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <Magnetic className="hidden sm:inline-flex">
              <a
                href={AI_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ink !py-2.5"
              >
                AI Hub <ArrowUpRight className="h-4 w-4" />
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sun text-ink md:hidden"
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isOpen ? 'close' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {isOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-sun md:hidden"
            initial={{ clipPath: 'circle(0% at 90% 8%)' }}
            animate={{ clipPath: 'circle(150% at 90% 8%)' }}
            exit={{ clipPath: 'circle(0% at 90% 8%)' }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <ShapeField seed="mobile-menu" tone="sun" count={6} mobileCount={6} sizes={[56, 110]} interactive={false} />
            <nav
              aria-label="Mobile"
              className="relative flex min-h-full flex-col justify-between px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-32 sm:px-6"
            >
              <ul>
                {NAV_LINKS.map((link, index) => (
                  <motion.li
                    key={link.to}
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + index * 0.07, duration: 0.6, ease: easeOut }}
                  >
                    <NavLink
                      to={link.to}
                      className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-4 font-display text-[clamp(2.5rem,11vw,3.25rem)] font-semibold tracking-[-0.045em] text-ink sm:py-5"
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-3">
                            {link.label}
                            {isActive && <span className="h-2.5 w-2.5 rounded-full bg-cobalt" />}
                          </span>
                          <span className="font-mono text-xs font-medium tracking-normal">0{index + 1}</span>
                        </>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <motion.a
                href={AI_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: easeOut }}
                className="mt-12 flex items-center justify-between rounded-full bg-ink px-6 py-4 font-medium text-paper"
              >
                Open the AI Hub <ArrowUpRight className="h-5 w-5" />
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
