import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import {
  AI_HUB_COURSES_URL,
  AI_HUB_URL,
  GITHUB_PROFILE_URL,
  GITHUB_URL,
  WP_SITE_URL,
} from '../lib/constants'
import { useFinePointer } from '../lib/hooks'
import { revealProps } from '../lib/inview'
import { easeOut, springPop } from '../lib/motion'
import ShapeField from './decor/ShapeField'
import LogoMark from './LogoMark'
import { ArrowUpRight } from './icons'

const FooterColumn = ({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string; external?: boolean }>
}) => (
  <div>
    <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink/75">{title}</h3>
    <ul className="mt-5 space-y-3 text-[15px]">
      {links.map((link) => (
        <li key={`${link.label}-${link.href}`}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline group inline-flex items-center gap-1 text-ink"
            >
              {link.label}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ) : (
            <Link to={link.href} className="link-underline text-ink">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
)

const LETTERS = 'NEVATAL'.split('')
// The plum dots of the logo, hung off a few of the letters.
const DOTS: Record<number, 'top' | 'bottom'> = { 2: 'bottom', 3: 'top', 4: 'bottom', 5: 'top', 6: 'bottom' }

const word: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const letter: Variants = {
  hidden: { y: '60%', opacity: 0, rotate: -8 },
  show: { y: '0%', opacity: 1, rotate: 0, transition: { duration: 0.9, ease: easeOut } },
}

const Wordmark = () => {
  const fine = useFinePointer()
  return (
    <div className="relative mt-16 select-none px-2 sm:mt-20">
      <motion.p
        aria-hidden="true"
        className="relative flex justify-center font-display font-bold leading-[0.8] tracking-[-0.06em] text-cobalt"
        style={{ fontSize: 'clamp(4.4rem, 21vw, 19rem)' }}
        variants={word}
        {...revealProps()}
      >
        {LETTERS.map((character, index) => (
          <motion.span
            key={`${character}-${index}`}
            variants={letter}
            whileHover={{ y: '-0.1em', rotate: index % 2 ? 7 : -7, transition: springPop }}
            className="relative inline-block cursor-default"
          >
            {character}
            {DOTS[index] && (
              <span
                className={`absolute left-[42%] h-[0.075em] w-[0.075em] rounded-full bg-plum ${
                  DOTS[index] === 'top' ? '-top-[0.06em]' : '-bottom-[0.02em]'
                }`}
              />
            )}
          </motion.span>
        ))}
      </motion.p>
      <ShapeField seed="footer" tone="sun" count={7} mobileCount={4} layout="scatter" sizes={[44, 100]} className="z-10" />
      {fine && (
        <p className="pointer-events-none absolute right-5 top-0 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink/75 sm:block">
          The shapes are loose — throw them around
        </p>
      )}
    </div>
  )
}

const Footer = () => (
  <footer className="relative overflow-clip rounded-t-[36px] bg-sun text-ink sm:rounded-t-[64px]">
    <div className="container-x pt-20 sm:pt-24">
      <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark tone="paper" />
            <span className="font-display text-lg font-semibold tracking-[-0.03em]">Nevatal</span>
          </div>
          <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-ink/80">
            An independent AI studio building products that earn their place — and keeping them
            running on hardware we control.
          </p>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink mt-7"
          >
            Follow the work on GitHub <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <FooterColumn
          title="Explore"
          links={[
            { label: 'About', href: '/about' },
            { label: 'Projects', href: '/projects' },
            { label: 'Writing', href: '/blog' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
          ]}
        />

        <FooterColumn
          title="Products"
          links={[
            { label: 'Nevatal AI Hub', href: AI_HUB_URL, external: true },
            { label: 'Free AI courses', href: AI_HUB_COURSES_URL, external: true },
            { label: 'LeetBug', href: 'https://leetbug.nevatal.id', external: true },
            { label: 'Recommendica', href: 'https://recommendica.nevatal.id', external: true },
            { label: 'Uptime Medics', href: 'https://uptime.nevatal.id', external: true },
          ]}
        />

        <FooterColumn
          title="Elsewhere"
          links={[
            { label: 'GitHub profile', href: GITHUB_PROFILE_URL, external: true },
            { label: 'Nevatal source', href: GITHUB_URL, external: true },
            { label: 'WordPress archive', href: WP_SITE_URL, external: true },
          ]}
        />
      </div>
    </div>

    <Wordmark />

    <div className="container-x pb-10">
      <div className="border-t border-ink/15 pt-6 text-xs leading-relaxed text-ink/75">
        <p>
          Nevatal is an independent, personal open-source software project developed in Indonesia, documented as technical articles, case studies, and educational resources. All Nevatal projects are strictly personal projects and are not affiliated with any commercial entity. The name was sourced from an automated business name generator for hackathons. The platform operates on a 100% free, non-profit basis (MIT licensed) and takes zero commercial profit. Any marketing, search engine optimization (SEO), and social media outreach conducted for this project is undertaken purely for educational and experimental purposes to study and observe the effectiveness of organic distribution. Not affiliated with, sponsored by, or endorsed by any external corporate entities, commercial enterprises, or medical EMR software platforms sharing a similar name, nor does it use their logos or branding. This project is under nevatal.id for educational purposes. Contact:{' '}
          <a href="mailto:nevatalapp@gmail.com" className="font-medium text-ink underline underline-offset-2">
            nevatalapp@gmail.com
          </a>
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-ink/15 pt-6 text-xs text-ink/75 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Nevatal. MIT Licensed. This project is under nevatal.id for educational purposes.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/about" className="hover:text-ink hover:underline">
            About
          </Link>
          <Link to="/privacy" className="hover:text-ink hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-ink hover:underline">
            Terms of Service
          </Link>
          <span>
            Writing powered by{' '}
            <a href={WP_SITE_URL} className="underline decoration-ink/30 underline-offset-4 hover:text-ink">
              WordPress
            </a>
          </span>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
