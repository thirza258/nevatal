import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { easeOut } from '../lib/motion'
import Cursor from './Cursor'
import Footer from './Footer'
import Header from './Header'
import ScrollProgress from './ScrollProgress'

const Layout = () => {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[95] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Cursor />
      <Header />
      {/* Enter-only: an exit would fight ScrollToTop, which jumps before the old page leaves. */}
      <motion.main
        key={pathname}
        id="main"
        className="flex-1"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut }}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}

export default Layout
