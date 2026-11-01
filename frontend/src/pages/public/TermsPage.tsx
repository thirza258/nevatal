import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm leading-relaxed text-gray-700">
      <div>
        <span className="text-xs uppercase font-mono tracking-wider font-semibold text-blue-600">Terms &amp; Acceptable Use</span>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-950">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Effective Date: November 1, 2026</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 text-sm text-blue-950">
        <strong className="block font-semibold mb-1">📢 Independent Personal Project &amp; Non-Affiliation Disclaimer:</strong>
        <p className="leading-relaxed">
          Nevatal is an independent, personal open-source software project developed in Indonesia, documented as technical articles, case studies, and educational resources. All Nevatal projects are strictly personal projects and are not affiliated with any commercial entity. The platform operates on a 100% free, non-profit basis (MIT licensed) and takes zero commercial profit. Any marketing, search engine optimization (SEO), and social media outreach conducted for this project is undertaken purely for educational and experimental purposes to study and observe the effectiveness of organic distribution. Nevatal is not affiliated with, sponsored by, or endorsed by any external corporate entities, commercial enterprises, or medical EMR (Electronic Medical Records) software platforms sharing a similar name, nor does it use their logos or branding. Any similarity in name is pure coincidence, originating from hackathon prototypes and personal developer experiments.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">1. Agreement to Terms</h2>
        <p>
          By accessing or utilizing Nevatal ("the Hub"), you agree to abide by these Terms of Service. If you do not agree with any part of these terms, you should not access or use the application.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">2. Self-Hosted Operations &amp; Purpose</h2>
        <p>
          Nevatal provides practical AI productivity utilities (including writing, summarization, proofreading, translation, and document search) and open-access educational courses. It is provided for personal, educational, and professional productivity workflows on private self-hosted deployments.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">3. Acceptable Use Guidelines</h2>
        <p>You agree not to use the Hub to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Generate malicious software, disinformation, phishing campaigns, or illegal content.</li>
          <li>Conduct denial-of-service attacks or bypass application throttling limits.</li>
          <li>Violate third-party intellectual property rights or software licenses.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">4. AI Provider Compliance (OpenRouter)</h2>
        <p>
          When using AI inference features powered by OpenRouter or external language model providers, you are also bound by the provider's terms and usage policies:
        </p>
        <div className="mt-2">
          <a
            href="https://openrouter.ai/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline"
          >
            → Read OpenRouter Terms of Service
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">5. Disclaimer of Warranties</h2>
        <p>
          Nevatal is distributed on an "AS IS" and "AS AVAILABLE" basis under the MIT License. The maintainers and host operators make no warranties regarding accuracy, uptime, or suitability for any specific legal or financial purpose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">6. Contact &amp; Legal Notices</h2>
        <p>
          For legal inquiries, takedown requests, or terms clarifications, please email{" "}
          <a href="mailto:nevatalapp@gmail.com" className="text-blue-600 font-semibold hover:underline">
            nevatalapp@gmail.com
          </a>
          .
        </p>
      </section>

      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
          ← Back to Nevatal Home
        </Link>
        <Link to="/privacy" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
          Privacy Policy →
        </Link>
      </div>
    </article>
  );
}
