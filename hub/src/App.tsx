import { lazy, Suspense, type ComponentType } from 'react'
import { MotionConfig } from 'framer-motion'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'

// Lazy-load subpages so the initial mobile bundle only contains the homepage
const LazyProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const LazyBlogPage = lazy(() => import('./pages/BlogPage'))
const LazyPostPage = lazy(() => import('./pages/PostPage'))
const LazyAboutPage = lazy(() => import('./pages/AboutPage'))
const LazyPrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const LazyTermsPage = lazy(() => import('./pages/TermsPage'))
const LazyNotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export interface AppPages {
  ProjectsPage?: ComponentType
  BlogPage?: ComponentType
  PostPage?: ComponentType
  AboutPage?: ComponentType
  PrivacyPage?: ComponentType
  TermsPage?: ComponentType
  NotFoundPage?: ComponentType
}

const PageFallback = () => (
  <div className="container-x py-24 sm:py-32" aria-hidden="true">
    <div className="h-10 w-48 animate-pulse rounded-full bg-ink/10" />
    <div className="mt-8 space-y-4">
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-ink/5" />
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-ink/5" />
    </div>
  </div>
)

const App = ({ pages }: { pages?: AppPages } = {}) => {
  const Projects = pages?.ProjectsPage ?? LazyProjectsPage
  const Blog = pages?.BlogPage ?? LazyBlogPage
  const Post = pages?.PostPage ?? LazyPostPage
  const About = pages?.AboutPage ?? LazyAboutPage
  const Privacy = pages?.PrivacyPage ?? LazyPrivacyPage
  const Terms = pages?.TermsPage ?? LazyTermsPage
  const NotFound = pages?.NotFoundPage ?? LazyNotFoundPage

  return (
    <MotionConfig reducedMotion="user">
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="projects" element={<Projects />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<Post />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </MotionConfig>
  )
}

export default App
