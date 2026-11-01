import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm leading-relaxed text-gray-700">
      <div>
        <span className="text-xs uppercase font-mono tracking-wider font-semibold text-blue-600">Privacy &amp; Data Ownership</span>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Effective Date: November 1, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">1. Fully Self-Hosted Guarantee</h2>
        <p>
          Nevatal is designed and deployed as an open-source, <strong>fully self-hosted</strong> AI productivity suite.
          Your uploaded documents, RAG embedding indexes, conversation history, and custom prompt templates remain stored on your private deployment's infrastructure.
        </p>
        <p>
          We do not sell, rent, commercialize, or track your personal data across the web. No tracking pixels or telemetry scripts harvest your inputs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">2. AI Inference &amp; OpenRouter Provider</h2>
        <p>
          Nevatal connects to modern neural models for generation, translation, summarization, proofreading, and document analysis. When configured with OpenRouter or visitor API keys:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Prompt text and document fragments sent for completion are securely dispatched to the configured provider API (OpenRouter).
          </li>
          <li>
            Your API calls and inputs are governed by the provider's privacy standards:
            <div className="mt-2 flex flex-col sm:flex-row gap-4 font-semibold text-blue-600">
              <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                → OpenRouter Privacy Policy
              </a>
              <a href="https://openrouter.ai/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
                → OpenRouter Terms of Service
              </a>
            </div>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">3. Storage &amp; Cookies</h2>
        <p>
          We use strictly necessary browser storage (such as session cookies and localStorage) exclusively to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Maintain your encrypted session state and workspace tool selections.</li>
          <li>Remember course reading progress and active workspace layouts.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">4. Your Rights</h2>
        <p>
          You have full control over your stored history. You may clear your conversation history, remove uploaded Document AI files, or erase your stored provider credentials at any time from within the workspace settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">5. Privacy Inquiries &amp; Contact</h2>
        <p>
          For privacy concerns, data deletion requests, or questions regarding our self-hosted infrastructure, contact us at{" "}
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
        <Link to="/terms" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
          Terms of Service →
        </Link>
      </div>
    </article>
  );
}
