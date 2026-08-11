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
];

export const ALL_TOOLS: ToolDefinition[] = TOOL_GROUPS.flatMap(
  (group) => group.tools
);

export const DEFAULT_TOOL_PATH = '/prompt';

export const findToolByPath = (pathname: string): ToolDefinition | undefined =>
  ALL_TOOLS.find((tool) => tool.path === pathname);
