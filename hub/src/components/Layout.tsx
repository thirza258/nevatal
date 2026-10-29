import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
    >
      Skip to content
    </a>
    <Header />
    <main id="main" className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
)

export default Layout
