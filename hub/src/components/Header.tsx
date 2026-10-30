import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AI_HUB_URL, NAV_LINKS } from '../lib/constants'
import { easeOut } from '../lib/motion'
import { ArrowUpRight, Close, Menu } from './icons'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b text-paper backdrop-blur transition-colors duration-300 ${
        scrolled
          ? 'border-white/10 bg-ink/95 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.9)]'
          : 'border-white/5 bg-ink/80'
      }`}
    >
      <div className="border-b border-white/10 bg-brand text-ink">
        <div className="container-x flex h-8 items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] sm:justify-between">
          <span className="sm:hidden">Nevatal AI Hub is live — 17 tools</span>
          <span className="hidden sm:inline">Nevatal AI Hub is live — seventeen tools, your own key</span>
          <a
            href={AI_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 hover:underline sm:inline-flex"
          >
            Open the workspace <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="container-x">
        <nav className="flex h-16 items-center justify-between gap-6" aria-label="Main">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Nevatal home">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-brand font-display text-base font-bold text-blue">
              N
              <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-maroon" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Nevatal</span>
          </Link>

          <ul className="hidden items-center gap-7 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `transition ${isActive ? 'text-paper' : 'text-paper/60 hover:text-paper'}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={AI_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary hidden !px-4 !py-2 sm:inline-flex"
            >
              AI Hub <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-paper md:hidden"
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id="mobile-nav"
              key="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="overflow-hidden border-t border-white/10 md:hidden"
            >
            <ul className="space-y-1 py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-base ${
                        isActive ? 'bg-white/10 text-paper' : 'text-paper/70'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <a
                  href={AI_HUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-between rounded-lg bg-brand px-3 py-2.5 font-semibold text-ink"
                >
                  Open the AI Hub <ArrowUpRight className="h-4 w-4" />
                </a>
              </li>
            </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header
