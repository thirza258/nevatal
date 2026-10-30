import { MotionConfig } from 'framer-motion'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import PostPage from './pages/PostPage'
import ProjectsPage from './pages/ProjectsPage'

const App = () => (
  <MotionConfig reducedMotion="user">
    <ScrollToTop />
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<PostPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </MotionConfig>
)

export default App
