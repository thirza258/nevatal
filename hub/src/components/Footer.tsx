import { Link } from 'react-router-dom'
import {
  AI_HUB_COURSES_URL,
  AI_HUB_URL,
  GITHUB_PROFILE_URL,
  GITHUB_URL,
  WP_SITE_URL,
} from '../lib/constants'
import { ArrowUpRight } from './icons'

const FooterColumn = ({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string; external?: boolean }>
}) => (
  <div>
    <h3 className="font-display text-sm font-semibold text-paper">{title}</h3>
    <ul className="mt-4 space-y-3 text-sm">
      {links.map((link) => (
        <li key={`${link.label}-${link.href}`}>
          {link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-paper/55 transition hover:text-paper"
            >
              {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link to={link.href} className="text-paper/55 transition hover:text-paper">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
)

const Footer = () => (
  <footer className="bg-ink text-paper/55">
    <div className="container-x py-16">
      <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-brand font-display text-base font-bold text-blue">
              N
              <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-maroon" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold text-paper">Nevatal</span>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            An independent AI studio building products that earn their place — and keeping them
            running on hardware we control.
          </p>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-paper transition hover:text-brand"
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

      <div className="mt-14 border-t border-white/10 pt-6 text-xs text-paper/50 leading-relaxed">
        <p>
          Nevatal is an independent, personal open-source software project developed in Indonesia, documented as technical articles, case studies, and educational resources. All Nevatal projects are strictly personal projects and are not affiliated with any commercial entity. The name was sourced from an automated business name generator for hackathons. The platform operates on a 100% free, non-profit basis (MIT licensed) and takes zero commercial profit. Any marketing, search engine optimization (SEO), and social media outreach conducted for this project is undertaken purely for educational and experimental purposes to study and observe the effectiveness of organic distribution. Not affiliated with, sponsored by, or endorsed by any external corporate entities, commercial enterprises, or medical EMR software platforms sharing a similar name, nor does it use their logos or branding. This project is under nevatal.id for educational purposes. Contact:{' '}
          <a href="mailto:nevatalapp@gmail.com" className="text-paper/80 underline hover:text-paper">
            nevatalapp@gmail.com
          </a>
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Nevatal. MIT Licensed. This project is under nevatal.id for educational purposes.</p>
        <div className="flex flex-wrap items-center gap-4 text-paper/60">
          <Link to="/about" className="hover:text-paper hover:underline">
            About
          </Link>
          <Link to="/privacy" className="hover:text-paper hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-paper hover:underline">
            Terms of Service
          </Link>
          <span>
            Writing powered by{' '}
            <a href={WP_SITE_URL} className="underline decoration-white/20 underline-offset-4 hover:text-paper">
              WordPress
            </a>
          </span>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
