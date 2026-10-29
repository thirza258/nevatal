import { Link } from 'react-router-dom'
import type { WPPost } from '../lib/wp'
import { decodeHtml, excerptText, formatDate } from '../lib/text'
import { ArrowUpRight } from './icons'

const tones = [
  { test: /artificial|machine| ai|ai /i, pill: 'bg-blue/10 text-blue', dot: 'bg-blue' },
  { test: /education|language|learning/i, pill: 'bg-brand/25 text-ink', dot: 'bg-brand' },
  { test: /web|developer|infrastructure|devops|community|programming/i, pill: 'bg-emerald-500/10 text-emerald-700', dot: 'bg-emerald-600' },
  { test: /research|academic/i, pill: 'bg-violet-500/10 text-violet-700', dot: 'bg-violet-600' },
  { test: /data|sustain/i, pill: 'bg-cyan-500/10 text-cyan-700', dot: 'bg-cyan-600' },
]

const toneFor = (name: string) =>
  tones.find((tone) => tone.test.test(name)) ?? {
    pill: 'bg-ink/5 text-ink/60',
    dot: 'bg-ink/30',
  }

const PostCard = ({ post, categoryName }: { post: WPPost; categoryName?: string }) => {
  const category = categoryName ?? 'Journal'
  const tone = toneFor(category)
  const title = decodeHtml(post.title.rendered)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_18px_50px_-24px_rgba(10,13,18,0.35)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {category}
        </span>
        <ArrowUpRight className="h-4 w-4 text-ink/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
      </div>

      <h3 className="mt-5 font-display text-xl leading-snug tracking-tight">{title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/60">
        {excerptText(post.excerpt.rendered)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-ink/55">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="font-semibold text-ink/60 transition group-hover:text-blue">Read the note</span>
      </div>
    </Link>
  )
}

export default PostCard
