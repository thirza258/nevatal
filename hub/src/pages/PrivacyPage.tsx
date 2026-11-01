import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons'
import { usePageMeta } from '../lib/seo'

const PrivacyPage = () => {
  usePageMeta({
    title: 'Privacy Policy — Nevatal',
    description:
      'Privacy Policy for Nevatal — an independent, non-profit personal software project developed in Indonesia.',
    path: '/privacy',
  })

  return (
    <>
      <section className="hero-surface text-paper">
        <div className="container-x py-16 sm:py-24">
          <p className="eyebrow text-brand">Legal &amp; Privacy</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-paper/60">
            Effective Date: November 1, 2026 &bull; Fully self-hosted &bull; Zero commercial profit
          </p>
        </div>
      </section>

      <section className="bg-paper py-16 text-ink sm:py-20">
        <div className="container-x max-w-4xl space-y-10">
          <div className="rounded-2xl border border-blue-600/20 bg-blue-500/5 p-6 sm:p-8 text-sm leading-relaxed text-ink/85">
            <h2 className="font-display text-lg font-semibold text-ink flex items-center gap-2 mb-3">
              <span>📢</span> Independent Personal Project &amp; Non-Affiliation Notice
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
          </div>

          <div className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">1. Fully Self-Hosted Guarantee</h2>
            <p className="leading-relaxed text-ink/75">
              Nevatal is designed and deployed as an open-source, <strong>fully self-hosted</strong> software
              portfolio and AI workspace suite. Your data, queries, and uploaded documents remain stored
              directly on infrastructure we control or your own local instances.
            </p>
            <p className="leading-relaxed text-ink/75">
              We do not sell, rent, commercialize, or track your personal data across the web. No tracking
              pixels, ad networks, or telemetry scripts harvest your inputs.
            </p>
          </div>

          <div className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">2. AI Inference &amp; OpenRouter Provider</h2>
            <p className="leading-relaxed text-ink/75">
              Tools within the Nevatal ecosystem connect to state-of-the-art language models (such as
              Gemini, OpenAI, or models routed via OpenRouter) using client-provided API keys or self-hosted
              proxy endpoints:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-ink/75">
              <li>
                Requests and prompt payloads dispatched to third-party model providers are subject to their
                respective privacy standards and retention limits.
              </li>
              <li>
                Review the provider terms directly:
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-600">
                  <a
                    href="https://openrouter.ai/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    OpenRouter Privacy Policy <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://openrouter.ai/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    OpenRouter Terms of Service <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">3. Storage &amp; Cookies</h2>
            <p className="leading-relaxed text-ink/75">
              Nevatal uses strictly necessary browser storage (such as localStorage and temporary session cookies)
              solely to retain your client-side preferences (such as theme choice, layout toggles, or locally
              held API keys in the AI Hub). We do not use third-party analytics trackers.
            </p>
          </div>

          <div className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">4. User Rights &amp; Data Control</h2>
            <p className="leading-relaxed text-ink/75">
              You maintain total authority over your inputs. You may clear your local storage, delete workspace
              documents, or revoke your API keys at any time directly from your browser.
            </p>
          </div>

          <div className="space-y-4 border-b border-ink/10 pb-8">
            <h2 className="font-display text-2xl font-semibold text-ink">5. Contact &amp; Privacy Requests</h2>
            <p className="leading-relaxed text-ink/75">
              If you have any questions, concerns, or data deletion requests regarding our privacy practices,
              contact us at:{' '}
              <a
                href="mailto:nevatalapp@gmail.com"
                className="font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
              >
                nevatalapp@gmail.com
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm font-semibold">
            <Link to="/" className="inline-flex items-center gap-2 text-ink/70 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <Link to="/terms" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
              Terms of Service <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default PrivacyPage
