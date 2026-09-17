import { ALL_TOOLS } from '../tools';

const METHOD_PATHS: Record<string, string> = {
  sentiment_analysis: '/sentiment', email_generation: '/email-builder',
  social_media_post_generation: '/social-caption', idea_generation: '/ideas',
  data_formatting: '/data-formatter', data_analysis: '/data-analysis',
  rag_chat: '/document-ai', direct_extraction: '/document-ai', image_generation: '/image-generation',
};

export function historyToolName(method: string) {
  return ALL_TOOLS.find((tool) => tool.path === (METHOD_PATHS[method] ?? `/${method}`))?.name
    ?? method.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Previews are plain text. Only the full response is rendered as Markdown. */
export function historyPreview(text: string) {
  return text.replace(/```[^\n]*\n?/g, '').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/(^|\n)\s{0,3}[#>]+\s*/g, ' ')
    .replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
}

export function historyDateGroup(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  today.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
