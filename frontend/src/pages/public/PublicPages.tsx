import { useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { GITHUB_URL } from '../../constant';
import CoursesPage from '../courses/CoursesPage';
import CoursePage from '../courses/CoursePage';
import AboutPage from '../about/AboutPage';
import NotFoundPage from '../NotFoundPage';

/** Shared by the browser and the static HTML build; no session is needed to read. */
export default function PublicPages() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    // Leaving a long lesson for the landing page must reveal the key form,
    // rather than carrying the lesson's scroll position into the new page.
    return () => window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <header className="bg-gray-900 text-white">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <img src="/logo.png" alt="" width={32} height={24} className="h-6 w-auto" />Nevatal
          </Link>
          <div className="flex items-center gap-4 text-sm sm:gap-6">
            <NavLink to="/courses" className={({ isActive }) => isActive ? 'font-semibold text-white' : 'text-gray-300 hover:text-white'}>Courses</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'font-semibold text-white' : 'text-gray-300 hover:text-white'}>About</NavLink>
            <Link to="/prompt" className="rounded-md bg-blue-600 px-3 py-2 font-semibold hover:bg-blue-500">Open workspace</Link>
          </div>
        </nav>
      </header>
      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CoursePage />} />
          <Route path="/about" element={<div className="px-4 py-10 sm:px-6"><AboutPage /></div>} />
          <Route path="*" element={<NotFoundPage homePath="/courses" homeLabel="Browse courses" />} />
        </Routes>
      </main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 text-sm text-gray-600 sm:flex-row sm:px-6">
          <p>Nevatal — practical AI tools and free courses.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-5">
            <Link to="/" className="hover:text-blue-700">Home</Link>
            <Link to="/courses" className="hover:text-blue-700">Courses</Link>
            <Link to="/about" className="hover:text-blue-700">About</Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700">Source on GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
