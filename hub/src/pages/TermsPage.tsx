import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons'
import PageHero from '../components/PageHero'
import Reveal from '../components/motion/Reveal'
import { usePageMeta } from '../lib/seo'

const TermsPage = () => {
  usePageMeta({
    title: 'Terms of Service — Nevatal',
    description:
      'Terms of Service for Nevatal — an independent, non-profit personal software project developed in Indonesia.',
    path: '/terms',
  })

  return (
    <>
      <PageHero
        eyebrow="Legal & Terms"
        shape="arch"
        shapeColor="plum"
        title="Terms of Service"
        accent="of Service"
        seed="terms-hero"
        lead={
          <p className="font-mono text-sm uppercase tracking-[0.08em] text-ink/60">
            Effective Date: November 1, 2026 &bull; MIT License &bull; Personal &amp; Educational Use
          </p>
        }
      />

      <section className="border-t border-ink/10 bg-paper py-16 text-ink sm:py-24">
        <div className="container-x max-w-4xl space-y-10">
          <Reveal className="rounded-[28px] bg-sun-soft p-6 text-sm leading-relaxed text-ink/85 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink flex items-center gap-2 mb-3">
              <span>📢</span> Independent Personal Project &amp; Non-Affiliation Disclaimer
            </h2>
            <p>
              Nevatal is an independent, personal open-source software project developed in Indonesia,
              documented as technical articles, case studies, and educational resources. All Nevatal
              projects are strictly personal projects and are not affiliated with any commercial entity.
              The platform operates on a 100% free, non-profit basis (MIT licensed) and takes zero commercial
              profit. Any marketing, search engine optimization (SEO), and social media outreach conducted for
              this project is undertaken purely for educational and experimental purposes to study and observe
              the effectiveness of organic distribution. Nevatal is not affiliated with, sponsored by, or
              endorsed by any external corporate entities, commercial enterprises, or medical EMR (Electronic
              Medical Records) software platforms sharing a similar name, nor does it use their logos or branding.
              Any similarity in name is pure coincidence, as the name was sourced from an automated business
              name generator for hackathon projects and personal developer experiments.
            </p>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">1. Agreement to Terms</h2>
            <p className="leading-relaxed text-ink/75">
              By accessing or using Nevatal and its hosted tools, you agree to comply with and be bound by
              these Terms of Service. If you do not agree with any portion of these terms, you should cease
              accessing or utilizing the platform.
            </p>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">2. Self-Hosted &amp; Educational Purpose</h2>
            <p className="leading-relaxed text-ink/75">
              Nevatal provides self-hosted productivity utilities, educational articles, and open AI tools.
              All applications are developed and offered on an independent, non-commercial basis for learning,
              experimentation, and personal development.
            </p>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">3. Acceptable Use Guidelines</h2>
            <p className="leading-relaxed text-ink/75">When utilizing Nevatal, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-ink/75">
              <li>Deploy automated denial-of-service scripts, spamming, or abuse against public instances.</li>
              <li>Attempt to compromise server security, exploit vulnerabilities, or bypass rate limits.</li>
              <li>Generate malicious software, disinformation campaigns, phishing, or unlawful material.</li>
              <li>Infringe upon the intellectual property or copyright of third parties.</li>
            </ul>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">4. AI Provider Compliance (OpenRouter)</h2>
            <p className="leading-relaxed text-ink/75">
              When utilizing AI generation, chat, and retrieval services powered by OpenRouter or external
              language model providers, you are also bound by the provider&apos;s acceptable use and terms of service:
            </p>
            <div className="mt-3">
              <a
                href="https://openrouter.ai/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-cobalt hover:underline"
              >
                OpenRouter Terms of Service <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">5. Disclaimer of Warranties &amp; MIT License</h2>
            <p className="leading-relaxed text-ink/75">
              Nevatal is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis under the MIT License,
              without warranties of any kind, express or implied. The developers and maintainers make no guarantees
              regarding availability, uptime, or fitness for specific commercial, clinical, or financial applications.
            </p>
          </Reveal>

          <Reveal className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">6. Contact &amp; Legal Notices</h2>
            <p className="leading-relaxed text-ink/75">
              For legal inquiries, terms clarification, or takedown notices, reach us directly at:{' '}
              <a
                href="mailto:nevatalapp@gmail.com"
                className="font-semibold text-cobalt underline underline-offset-4 hover:text-ink"
              >
                nevatalapp@gmail.com
              </a>
              .
            </p>
          </Reveal>

          <Reveal className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm font-semibold">
            <Link to="/" className="inline-flex items-center gap-2 text-ink/70 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <Link to="/privacy" className="inline-flex items-center gap-2 text-cobalt hover:text-ink">
              Privacy Policy <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default TermsPage
