export interface ToolDefinition {
  name: string;
  path: string;
  description: string;
}

export interface ToolGroup {
  name: string;
  tools: ToolDefinition[];
}

/**
 * Single source of truth for the tool list: the sidebar, the navbar title, and
 * the router all read from here, so a tool cannot exist in one and not another.
 */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    name: 'Ask & explain',
    tools: [
      {
        name: 'Prompt',
        path: '/prompt',
        description: 'Open-ended chat with the model.',
      },
      {
        name: 'Explainer',
        path: '/explainer',
        description: 'Concepts explained at the depth you choose.',
      },
    ],
  },
  {
    name: 'Write & edit',
    tools: [
      {
        name: 'Writer',
        path: '/writer',
        description: 'Turn a brief into a finished draft.',
      },
      {
        name: 'Rewriter',
        path: '/rewriter',
        description: 'Rework text towards a specific goal.',
      },
      {
        name: 'Proofreader',
        path: '/proofreader',
        description: 'Fix errors without losing your voice.',
      },
      {
        name: 'Summarizer',
        path: '/summarizer',
        description: 'Condense long text into the shape you need.',
      },
    ],
  },
  {
    name: 'Business',
    tools: [
      {
        name: 'Copywriting',
        path: '/copywriting',
        description: 'Marketing copy shaped for its channel.',
      },
      {
        name: 'Email Builder',
        path: '/email-builder',
        description: 'Draft an email from its context.',
      },
      {
        name: 'Social Caption',
        path: '/social-caption',
        description: 'Captions shaped for TikTok, LinkedIn, X and the rest.',
      },
      {
        name: 'Idea Generator',
        path: '/ideas',
        description: 'Brainstorm names, business ideas, angles and topics.',
      },
    ],
  },
  {
    name: 'Language & analysis',
    tools: [
      {
        name: 'Translator',
        path: '/translator',
        description: 'Translate with control over register.',
      },
      {
        name: 'Sentiment Analysis',
        path: '/sentiment',
        description: 'Judge the tone of feedback and reviews.',
      },
    ],
  },
  {
    name: 'Documents & media',
    tools: [
      {
        name: 'Document AI',
        path: '/document-ai',
        description: 'Chat with the contents of a PDF.',
      },
      {
        name: 'Image Generation',
        path: '/image-generation',
        description: 'Generate an image from a description.',
      },
    ],
  },
  {
    name: 'Data & bulk',
    tools: [
      {
        name: 'Data Analysis',
        path: '/data-analysis',
        description: 'Upload a CSV and get insights and charts back.',
      },
      {
        name: 'Data Formatter',
        path: '/data-formatter',
        description: 'Clean, validate and convert pasted data.',
      },
      {
        name: 'Batch Runner',
        path: '/batch',
        description: 'Run one tool over many inputs at once.',
      },
    ],
  },
];

/**
 * Workspace pages that are not AI tools.
 *
 * Kept out of TOOL_GROUPS because that list is also what the landing page
 * advertises, and "Usage & keys" is not something the app can do for you.
 */
export const SESSION_PAGES: ToolDefinition[] = [
  {
    name: 'Usage & keys',
    path: '/usage',
    description: 'What this session has spent, and the keys it can spend on.',
  },
];

export const ALL_TOOLS: ToolDefinition[] = TOOL_GROUPS.flatMap(
  (group) => group.tools
);

export const DEFAULT_TOOL_PATH = '/prompt';

export const findToolByPath = (pathname: string): ToolDefinition | undefined =>
  [...ALL_TOOLS, ...SESSION_PAGES].find((tool) => tool.path === pathname);
