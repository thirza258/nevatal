import { useEffect, useState } from 'react'
import AICapabilities from '../sections/AICapabilities'
import AIHubSection from '../sections/AIHubSection'
import CapabilitiesSection from '../sections/CapabilitiesSection'
import EngineeringShowcase from '../sections/EngineeringShowcase'
import FeaturedProjects from '../sections/FeaturedProjects'
import FinalCTA from '../sections/FinalCTA'
import HomeHero from '../sections/HomeHero'
import InfrastructureSection from '../sections/InfrastructureSection'
import LatestWriting from '../sections/LatestWriting'
import LearningSection from '../sections/LearningSection'
import ProductEcosystem from '../sections/ProductEcosystem'
import StudioIntroduction from '../sections/StudioIntroduction'
import { GITHUB_PROFILE_URL, SITE_URL } from '../lib/constants'
import { usePageMeta } from '../lib/seo'
import { getCategories, getPosts, type WPPost } from '../lib/wp'

const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nevatal',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'An independent AI studio building AI workspaces, grounded retrieval tools, learning platforms and developer utilities.',
  sameAs: [GITHUB_PROFILE_URL],
}

const HomePage = () => {
  const [posts, setPosts] = useState<WPPost[]>([])
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [postsState, setPostsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [postTotal, setPostTotal] = useState<number | null>(null)

  usePageMeta({
    title: 'Nevatal — Independent AI Studio',
    description:
      'Nevatal builds practical AI products, developer tools, and intelligent digital experiences.',
    path: '/',
    jsonLd: ORGANIZATION_LD,
  })

  useEffect(() => {
    let alive = true

    Promise.allSettled([getPosts({ perPage: 3 }), getCategories()]).then(([postsResult, categoriesResult]) => {
      if (!alive) return
      if (postsResult.status === 'fulfilled') {
        setPosts(postsResult.value.posts)
        setPostTotal(postsResult.value.total)
        setPostsState('ready')
      } else {
        setPostsState('error')
      }
      if (categoriesResult.status === 'fulfilled') {
        setCategoryNames(
          Object.fromEntries(categoriesResult.value.map((category) => [String(category.id), category.name]))
        )
      }
    })

    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <HomeHero postTotal={postTotal} />
      <StudioIntroduction />
      <ProductEcosystem />
      <AIHubSection />
      <AICapabilities />
      <EngineeringShowcase />
      <FeaturedProjects />
      <LearningSection />
      <InfrastructureSection />
      <CapabilitiesSection />
      <LatestWriting posts={posts} categories={categoryNames} state={postsState} />
      <FinalCTA />
    </>
  )
}

export default HomePage
