import { Link } from 'react-router-dom'
import type { WPPost } from '../lib/wp'
import { decodeHtml, excerptText, formatDate } from '../lib/text'
import Shape, { type ShapeColor, type ShapeKind } from './decor/Shape'
import { ArrowUpRight } from './icons'

interface Tone {
  test: RegExp
  pill: string
  kind: ShapeKind
  color: ShapeColor
}

const tones: Tone[] = [
  { test: /artificial|machine| ai|ai /i, pill: 'bg-cobalt/10 text-cobalt', kind: 'sparkle', color: 'cobalt' },
  { test: /education|language|learning/i, pill: 'bg-sun-soft text-ink', kind: 'flower', color: 'sun' },
  { test: /web|developer|infrastructure|devops|community|programming/i, pill: 'bg-ink/[0.06] text-ink', kind: 'square', color: 'ink' },
  { test: /research|academic/i, pill: 'bg-plum/10 text-plum', kind: 'burst', color: 'plum' },
  { test: /data|sustain/i, pill: 'bg-cobalt/10 text-cobalt', kind: 'quarter', color: 'cobalt' },
]

const fallback: Omit<Tone, 'test'> = { pill: 'bg-ink/[0.06] text-ink/75', kind: 'circle', color: 'ink' }

const toneFor = (name: string) => tones.find((tone) => tone.test.test(name)) ?? fallback

export const PostSkeleton = () => (
  <div className="h-72 animate-pulse rounded-[30px] border border-ink/10 bg-paper p-6">
    <div className="h-6 w-28 rounded-full bg-sun-soft" />
    <div className="mt-7 h-5 w-4/5 rounded-full bg-ink/10" />
    <div className="mt-3 h-5 w-3/5 rounded-full bg-ink/10" />
    <div className="mt-8 h-3 w-full rounded-full bg-ink/5" />
    <div className="mt-2 h-3 w-2/3 rounded-full bg-ink/5" />
  </div>
)

const PostCard = ({ post, categoryName }: { post: WPPost; categoryName?: string }) => {
  const category = categoryName ?? 'Journal'
  const tone = toneFor(category)
  const title = decodeHtml(post.title.rendered)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[30px] border border-ink/10 bg-paper p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-ink/20 hover:shadow-[0_34px_70px_-40px_rgba(11,11,13,0.45)]"
    >
      <Shape
        kind={tone.kind}
        color={tone.color === 'ink' ? 'sun' : tone.color}
        className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rotate-12 scale-0 transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-100"
      />
      <div className="relative flex items-center justify-between gap-3">
        <span
          className={`inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${tone.pill}`}
        >
          <Shape kind={tone.kind} color={tone.color} className="h-3 w-3 flex-none" />
          <span className="truncate">{category}</span>
        </span>
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-ink/10 transition-colors duration-300 group-hover:border-sun group-hover:bg-sun">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </div>

      <h3 className="relative mt-6 break-words font-display text-[22px] font-semibold leading-snug tracking-[-0.03em]">
        {title}
      </h3>
      <p className="relative mt-3 line-clamp-3 break-words text-sm leading-relaxed text-ink/60">
        {excerptText(post.excerpt.rendered)}
      </p>

      <div className="relative mt-auto flex items-center justify-between gap-3 pt-7 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/60">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="font-medium text-ink">Read the note</span>
      </div>
    </Link>
  )
}

export default PostCard
