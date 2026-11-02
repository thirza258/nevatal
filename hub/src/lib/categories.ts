import type { ShapeColor, ShapeKind } from '../components/decor/Shape'
import type { ProjectCategory } from '../data/projects'

/** Each category gets its own shape, so a project's kind reads at a glance. */
export const CATEGORY_SHAPE: Record<ProjectCategory, { kind: ShapeKind; color: ShapeColor }> = {
  'AI & Research': { kind: 'sparkle', color: 'cobalt' },
  Learning: { kind: 'flower', color: 'sun' },
  Creative: { kind: 'burst', color: 'plum' },
  Data: { kind: 'quarter', color: 'cobalt' },
  'Tools & Ops': { kind: 'square', color: 'ink' },
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
