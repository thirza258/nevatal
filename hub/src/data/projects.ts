export const PROJECT_CATEGORIES = [
  'AI & Research',
  'Learning',
  'Creative',
  'Data',
  'Tools & Ops',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export interface Project {
  name: string
  slug: string
  tagline: string
  description: string
  category: ProjectCategory
  tags: string[]
  url?: string
  featured?: boolean
}

export const PROJECTS: Project[] = [
  {
    name: 'Nevatal AI Hub',
    slug: 'ai-hub',
    tagline: 'Seventeen AI tools, one workspace, your own key.',
    description:
      'Prompting, writing, translation, document Q&A, image generation, data analysis and batch runs — each with a purpose-built form, and every request billed to the key you bring.',
    category: 'AI & Research',
    tags: ['React', 'Django', 'Bring your own key'],
    url: 'https://chat.nevatal.id',
  },
  {
    name: 'ChattyDesk',
    slug: 'chattydesk',
    tagline: 'Every AI model in one chat window.',
    description:
      'A single desk for the models you use — keep conversations together and move between providers without changing tools.',
    category: 'AI & Research',
    tags: ['Multi-model', 'Chat'],
    url: 'https://chatty.nevatal.id',
    featured: true,
  },
  {
    name: 'Recommendica',
    slug: 'recommendica',
    tagline: 'Research recommendations that actually cite.',
    description:
      'A recommendation API and RAG pipeline that finds relevant papers, grounded in the literature rather than in a model’s memory.',
    category: 'AI & Research',
    tags: ['Django', 'RAG', 'Search'],
    url: 'https://recommendica.nevatal.id',
    featured: true,
  },
  {
    name: 'RAGReader',
    slug: 'ragreader',
    tagline: 'Compare retrieval pipelines, not just answers.',
    description:
      'Document Q&A where dense, sparse and hybrid retrieval meet multi-LLM consensus — built for readers who want to see how an answer was reached.',
    category: 'AI & Research',
    tags: ['RAG', 'Multi-LLM'],
    url: 'https://rag.nevatal.id',
  },
  {
    name: 'CRAG MultiHop',
    slug: 'crag-multihop',
    tagline: 'Corrective, multi-hop RAG with reranking.',
    description:
      'Dense and BM25 retrieval, self-grading, query correction and reranking — followed by an evaluation of faithfulness and answer relevancy.',
    category: 'AI & Research',
    tags: ['FastAPI', 'Chroma', 'Reranking'],
    url: 'https://crag.nevatal.id',
  },
  {
    name: 'DivinityAI',
    slug: 'divinityai',
    tagline: 'Answers grounded in Quran and authenticated Hadith.',
    description:
      'A retrieval system that refuses to guess: every answer cites a verifiable verse or narration, and says so when the corpus is not enough.',
    category: 'AI & Research',
    tags: ['RAG', 'Ollama', 'Citations'],
    url: 'https://muslim.nevatal.id',
  },
  {
    name: 'Furina ML',
    slug: 'furina-ml',
    tagline: 'Train scikit-learn models without writing code.',
    description:
      'Upload a CSV, profile and clean it, choose a model, tune it and live-predict — with every evaluation number coming from a real fitted model.',
    category: 'AI & Research',
    tags: ['scikit-learn', 'FastAPI', 'React'],
    url: 'https://furina.nevatal.id',
    featured: true,
  },
  {
    name: 'My Mock Interview',
    slug: 'mock-interview',
    tagline: 'Interview practice built around your resume.',
    description:
      'Generate a tailored interview from your CV and a job description, get scored answers, or reverse the roles and interview an AI candidate. Includes a 90-lesson interview academy.',
    category: 'AI & Research',
    tags: ['React', 'FastAPI', 'LLM'],
    url: 'https://interview.nevatal.id',
  },
  {
    name: 'Quanta',
    slug: 'quanta',
    tagline: 'An investment learning workspace that runs.',
    description:
      'Fifteen courses across markets, ethics, strategy and Python bots, with a trading simulator, strategy lab and econometrics playground.',
    category: 'Learning',
    tags: ['Django', 'Simulator', 'Courses'],
    url: 'https://quant.nevatal.id',
  },
  {
    name: 'VoltQuest',
    slug: 'voltquest',
    tagline: 'From logic gates to WinUI, with labs that run.',
    description:
      'Courses in computer architecture, assembly, electronics and desktop development, with runnable tutorials, exams and verifiable PDF certificates.',
    category: 'Learning',
    tags: ['C++', 'Courses', 'Certificates'],
    url: 'https://pcb.nevatal.id',
  },
  {
    name: 'LeetBug',
    slug: 'leetbug',
    tagline: 'Debugging practice for people who ship.',
    description:
      'Hundreds of executable case studies across five languages, with progressive hints, hidden tests and a sandboxed runner that grades the fix, not the answer.',
    category: 'Learning',
    tags: ['FastAPI', 'React', 'Sandbox'],
    url: 'https://leetbug.nevatal.id',
    featured: true,
  },
  {
    name: 'Decalove',
    slug: 'decalove',
    tagline: 'A visual novel written with you, not just played.',
    description:
      'An AI-directed story engine that keeps character memory straight, generates scenes behind the scenes, and ships with a rich-text writing studio and courses.',
    category: 'Creative',
    tags: ['AI storytelling', "Ren'Py", 'React'],
    url: 'https://decalove.nevatal.id',
    featured: true,
  },
  {
    name: 'English & IELTS Practice',
    slug: 'english-practice',
    tagline: 'A diagnostic path from beginner to Band 8.',
    description:
      'Guided English courses and focused practice modes for grammar, writing and IELTS-style tasks, with lessons that explain the why.',
    category: 'Learning',
    tags: ['Django', 'Education'],
    url: 'https://english.nevatal.id',
  },
  {
    name: 'Gemini Japanese',
    slug: 'gemini-japanese',
    tagline: 'A complete Japanese study workspace.',
    description:
      'N5–N1 courses, 200 kanji cards, grammar drills and original listening passages, wrapped in a sakura theme that follows your device.',
    category: 'Learning',
    tags: ['React', 'Education'],
    url: 'https://hira.nevatal.id',
  },
  {
    name: 'AdControl Learning',
    slug: 'adcontrol-learning',
    tagline: 'Free digital marketing courses, from SEO to GEO.',
    description:
      'Free, practical courses on digital marketing, SEO, GEO, SEM, affiliate marketing, analytics and conversion optimization — from AdControl Learning.',
    category: 'Learning',
    tags: ['Courses', 'Marketing'],
    url: 'https://marketing.nevatal.id',
  },
  {
    name: 'SDG Country Profiles',
    slug: 'sdg-country-profiles',
    tagline: 'How every country is doing on the 17 goals.',
    description:
      'Country scorecards built from Sustainable Development Report datasets, with live World Bank indicators and rankings that keep sources and years distinct.',
    category: 'Data',
    tags: ['Django', 'UN SDG', 'Data'],
    url: 'https://sdg.nevatal.id',
  },
  {
    name: 'Uptime Medics',
    slug: 'uptime-medics',
    tagline: 'Know before your users do.',
    description:
      'A Rust-powered uptime monitor with second-level probes, public status pages and SMTP alerts that fire after two consecutive failures.',
    category: 'Tools & Ops',
    tags: ['Rust', 'Axum', 'SQLite'],
    url: 'https://uptime.nevatal.id',
    featured: true,
  },
  {
    name: 'Nevatal URL Shortener',
    slug: 'url-shortener',
    tagline: 'Short links with analytics that mean something.',
    description:
      'A Django shortener with custom slugs, duplicate protection, click analytics, rate limiting and root-path redirects.',
    category: 'Tools & Ops',
    tags: ['Django', 'Analytics'],
    url: 'https://url.nevatal.id',
  },
  {
    name: 'Webisaurus',
    slug: 'webisaurus',
    tagline: '140 languages, 24 concepts, side by side.',
    description:
      'A zero-backend syntax reference and code comparator: browse how each language expresses a concept, then compare two or three implementations.',
    category: 'Tools & Ops',
    tags: ['Vanilla JS', 'Static', 'Nginx'],
    url: 'https://c.nevatal.id',
  },
  {
    name: 'GenshinWallCraft',
    slug: 'genshinwallcraft',
    tagline: 'Wallpapers and pixel art, made for the grind.',
    description:
      'Generate task-overlay wallpapers from artwork, manage saved tasks and private downloads, or open Pixel Studio to draw characters, tilesets and scenes.',
    category: 'Creative',
    tags: ['Generators', 'Pixel art'],
    url: 'https://genshinwallpaper.nevatal.id',
  },
  {
    name: 'Literal Storyboard',
    slug: 'literal-storyboard',
    tagline: 'An AI story that unfolds on the map.',
    description:
      'Pick a city, get a fresh story beat, choices and painted scenery — every model call routed through OpenRouter so the storyteller can be swapped.',
    category: 'Creative',
    tags: ['OpenRouter', 'Games'],
  },
  {
    name: 'VideoTex',
    slug: 'videotex',
    tagline: 'A video platform without the moderation queue.',
    description:
      'Self-hosted video upload with FFmpeg transcoding, HTTP-206 streaming, comments and a durable leased work queue that survives restarts.',
    category: 'Creative',
    tags: ['Django', 'FFmpeg', 'Queue'],
  },
]

export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured)

export const LIVE_PROJECTS = PROJECTS.filter((project) => Boolean(project.url))

export const PROJECT_CATEGORY_TONE: Record<ProjectCategory, string> = {
  'AI & Research': 'bg-blue',
  Learning: 'bg-brand',
  Creative: 'bg-maroon',
  Data: 'bg-emerald-600',
  'Tools & Ops': 'bg-ink',
}
