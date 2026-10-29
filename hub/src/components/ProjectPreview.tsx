import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '../data/projects'
import { ArrowUpRight, Close, ImageIcon, Monitor } from './icons'

const LIVE_TIMEOUT_MS = 9000
const SHOT_RETRY_MS = 7000
const SHOT_MAX_ATTEMPTS = 8
const SHOT_READY_WIDTH = 1000

type Tab = 'live' | 'screenshot'

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const shotSource = (url: string, seed: string, attempt: number) =>
  `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=800&v=${seed}${attempt}`

const tabClass = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition ${
    active ? 'bg-ink text-paper shadow-sm' : 'text-ink/55 hover:text-ink'
  }`

const ProjectPreview = ({
  project,
  url,
  onClose,
}: {
  project: Project
  url: string
  onClose: () => void
}) => {
  const [tab, setTab] = useState<Tab>('live')
  const [liveReady, setLiveReady] = useState(false)
  const [liveTimedOut, setLiveTimedOut] = useState(false)
  const [shotAttempt, setShotAttempt] = useState(0)
  const [shotReady, setShotReady] = useState(false)
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 8))
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  useEffect(() => {
    if (tab !== 'live' || liveReady || liveTimedOut) return
    const timer = window.setTimeout(() => {
      setLiveTimedOut(true)
      setTab('screenshot')
    }, LIVE_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [tab, liveReady, liveTimedOut])

  useEffect(() => {
    if (tab !== 'screenshot' || shotReady || shotAttempt >= SHOT_MAX_ATTEMPTS - 1) return
    const timer = window.setTimeout(() => setShotAttempt((attempt) => attempt + 1), SHOT_RETRY_MS)
    return () => window.clearTimeout(timer)
  }, [tab, shotAttempt, shotReady])

  const shotExhausted = tab === 'screenshot' && !shotReady && shotAttempt >= SHOT_MAX_ATTEMPTS - 1
  const host = hostOf(url)

  const retryScreenshot = () => {
    setSeed(Math.random().toString(36).slice(2, 8))
    setShotAttempt(0)
    setShotReady(false)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex bg-ink/70 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${project.name} preview`}
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[82vh] sm:max-w-6xl sm:rounded-2xl"
      >
        <header className="flex items-center gap-2 border-b border-ink/10 px-3 py-2.5 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold">{project.name}</p>
            <p className="truncate text-xs text-ink/50">{host}</p>
          </div>

          <div className="flex flex-none rounded-full border border-ink/15 bg-ink/[0.04] p-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <button
              type="button"
              aria-pressed={tab === 'live'}
              onClick={() => setTab('live')}
              className={tabClass(tab === 'live')}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Live</span>
            </button>
            <button
              type="button"
              aria-pressed={tab === 'screenshot'}
              onClick={() => setTab('screenshot')}
              className={tabClass(tab === 'screenshot')}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-none items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55 transition hover:border-ink/30 hover:bg-ink hover:text-paper"
          >
            <span className="hidden sm:inline">Open site</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex-none rounded-full border border-ink/10 p-1.5 text-ink/55 transition hover:border-ink/30 hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <Close className="h-4 w-4" />
          </button>
        </header>

        {tab === 'screenshot' && liveTimedOut && !liveReady && (
          <p className="border-b border-amber-200/70 bg-amber-50 px-4 py-2 text-xs leading-relaxed text-amber-900">
            The live view didn’t load in time, so a screenshot is shown instead. You can switch back
            to Live anytime.
          </p>
        )}

        <div className="relative flex-1 overflow-hidden bg-ink/[0.03]">
          {tab === 'live' ? (
            <>
              <iframe
                src={url}
                title={`${project.name} live preview`}
                className="h-full w-full border-0 bg-white"
                onLoad={() => setLiveReady(true)}
                allow="fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              {!liveReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                  <p className="text-xs font-medium text-ink/55">Loading live preview…</p>
                </div>
              )}
            </>
          ) : (
            <>
              <img
                key={shotAttempt}
                src={shotSource(url, seed, shotAttempt)}
                alt={`Screenshot of ${project.name}`}
                className={`h-full w-full object-cover object-top transition-opacity duration-700 ${
                  shotReady ? 'opacity-100' : 'opacity-30'
                }`}
                onLoad={(event) => {
                  if (event.currentTarget.naturalWidth >= SHOT_READY_WIDTH) setShotReady(true)
                }}
              />
              {!shotReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  {shotExhausted ? (
                    <>
                      <p className="text-sm font-semibold">The screenshot is still rendering.</p>
                      <p className="max-w-sm text-xs leading-relaxed text-ink/55">
                        A fresh capture can take a minute. Try again, or open the site directly.
                      </p>
                      <button type="button" onClick={retryScreenshot} className="btn btn-dark mt-1 !px-4 !py-2 text-xs">
                        Retry screenshot
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                      <p className="text-xs font-medium text-ink/55">
                        Generating screenshot…{' '}
                        {shotAttempt > 0 && `attempt ${shotAttempt + 1} of ${SHOT_MAX_ATTEMPTS}`}
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-2.5">
          <p className="text-[11px] leading-relaxed text-ink/45">
            {tab === 'live'
              ? 'Blank frame? The site may block embedding — switch to Screenshot.'
              : 'Screenshots render on demand via WordPress mShots.'}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none text-xs font-semibold text-ink/60 underline underline-offset-4 hover:text-ink"
          >
            Open {host}
          </a>
        </footer>
      </div>
    </div>,
    document.body
  )
}

export default ProjectPreview
