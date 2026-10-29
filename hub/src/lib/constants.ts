export const SITE_NAME = 'Nevatal'
export const SITE_URL = 'https://nevatal.id'

export const AI_HUB_URL = 'https://chat.nevatal.id'
export const AI_HUB_COURSES_URL = 'https://chat.nevatal.id/courses'
export const GITHUB_URL = 'https://github.com/thirza258/nevatal'
export const GITHUB_PROFILE_URL = 'https://github.com/thirza258'

export const WP_SITE_URL = 'https://wordpress.nevatal.id'

const configuredBase = import.meta.env.VITE_WP_API_BASE as string | undefined

export const WP_API_BASES = [
  configuredBase,
  'https://wordpress.nevatal.id/wp-json/wp/v2',
  'https://nevatal.id/wp-json/wp/v2',
].filter((value): value is string => Boolean(value))

export const NAV_LINKS = [
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Writing' },
  { to: '/about', label: 'Studio' },
]

export const AI_TOOLS = [
  'Prompt',
  'Writer',
  'Translator',
  'Document AI',
  'Image Gen',
  'Data Analysis',
  'Batch',
]
