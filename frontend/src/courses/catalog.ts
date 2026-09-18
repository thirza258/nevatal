export interface Course {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate';
  minutes: number;
  updated: string;
  toolPaths: string[];
  outcomes: string[];
}

/** Public course metadata also drives discovery, page metadata and the sitemap. */
export const COURSES: Course[] = [
  {
    slug: 'prompting-fundamentals',
    title: 'Prompting fundamentals',
    description: 'Turn a vague question into a clear brief, choose useful context, and check an AI answer before you use it.',
    category: 'Getting started',
    level: 'Beginner',
    minutes: 20,
    updated: '2026-09-18',
    toolPaths: ['/prompt', '/explainer'],
    outcomes: ['Write a prompt with a task, context and output format.', 'Use remembered messages deliberately.', 'Check an explanation against the facts you supplied.'],
  },
  {
    slug: 'writing-and-editing',
    title: 'Write, edit and summarize',
    description: 'Build a first draft from a brief, revise it for your audience, and produce a summary that keeps the important details.',
    category: 'Writing',
    level: 'Beginner',
    minutes: 30,
    updated: '2026-09-18',
    toolPaths: ['/writer', '/rewriter', '/proofreader', '/summarizer'],
    outcomes: ['Give Writer a usable brief and source facts.', 'Separate structural edits from proofreading.', 'Check that a summary preserves decisions, owners and dates.'],
  },
  {
    slug: 'business-content',
    title: 'Create useful business content',
    description: 'Move from a small campaign brief to grounded copy, a clear email and social captions shaped for their audience.',
    category: 'Business',
    level: 'Beginner',
    minutes: 30,
    updated: '2026-09-18',
    toolPaths: ['/ideas', '/copywriting', '/email-builder', '/social-caption'],
    outcomes: ['Compare campaign ideas against a concrete goal.', 'Draft an email with one clear next action.', 'Adapt the same facts to different channels without inventing claims.'],
  },
  {
    slug: 'translation-and-feedback',
    title: 'Translate and understand feedback',
    description: 'Translate with the right register and read customer feedback without losing names, numbers or mixed opinions.',
    category: 'Language',
    level: 'Beginner',
    minutes: 25,
    updated: '2026-09-18',
    toolPaths: ['/translator', '/sentiment'],
    outcomes: ['Choose a translation register for the reader.', 'Review translations for factual changes.', 'Separate positive and negative aspects of a review.'],
  },
  {
    slug: 'documents-and-images',
    title: 'Work with documents and images',
    description: 'Ask focused questions about a PDF and write image briefs with a clear subject, composition and style.',
    category: 'Documents & media',
    level: 'Intermediate',
    minutes: 30,
    updated: '2026-09-18',
    toolPaths: ['/document-ai', '/image-generation'],
    outcomes: ['Ask questions that can be answered from an uploaded PDF.', 'Verify a document answer against the original.', 'Refine an image by changing one part of the brief at a time.'],
  },
  {
    slug: 'data-and-batch-workflows',
    title: 'Clean data and run repeatable tasks',
    description: 'Convert messy records, check a CSV analysis and test a small batch before running the same task over more inputs.',
    category: 'Data',
    level: 'Intermediate',
    minutes: 35,
    updated: '2026-09-18',
    toolPaths: ['/data-formatter', '/data-analysis', '/batch'],
    outcomes: ['Specify a schema without making up missing values.', 'Check charts and insights against a small known dataset.', 'Review batch inputs, failures and downloaded results.'],
  },
];

export const coursePath = (course: Course) => `/courses/${course.slug}`;
export const findCourse = (slug: string) => COURSES.find((course) => course.slug === slug);
