import React from 'react';
import ApiKeyForm from './ApiKeyForm';
import { ALL_TOOLS, TOOL_GROUPS } from '../../tools';
import { GITHUB_URL, SITE_URL } from '../../constant';

interface LandingPageProps {
  onKeySubmit: (provider: string) => void;
}

interface Step {
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: 'Bring a key',
    body: 'Paste a key from OpenAI, Google Gemini or OpenRouter. There is no account to create and nothing to pay for on top of what your provider charges.',
  },
  {
    title: 'Pick a tool',
    body: 'Every tool is a small, purpose-built form instead of a blank chat box, so you spend your time on the input rather than on prompt wording.',
  },
  {
    title: 'Keep the output',
    body: 'Each run is recorded in the sidebar history for the session, so you can come back to an answer instead of generating it twice.',
  },
];

interface Faq {
  question: string;
  answer: string;
}

/** Rendered as the visible FAQ *and* as FAQPage structured data, so the two
 *  can never drift apart. */
const FAQS: Faq[] = [
  {
    question: 'Is Nevatal free?',
    answer:
      'Nevatal itself is free and open source under the MIT licence. You pay your AI provider directly for the tokens you use, at their normal rates, because every request is made with your own API key.',
  },
  {
    question: 'Where is my API key stored?',
    answer:
      "The browser encrypts your key with the backend's RSA public key (RSA-OAEP with SHA-256) before it is sent, so nothing in between sees it in clear text. Once validated it is kept in an httpOnly cookie, encrypted with the server's secret key. It is never written to localStorage, and \"Clear API key\" removes it at any time.",
  },
  {
    question: 'Which providers are supported?',
    answer:
      'OpenAI, Google Gemini and OpenRouter. All text tools work with any of the three. An OpenRouter key also gets a model picker in the top bar, listing every model OpenRouter can route to, so the tools can run on whichever one you want. Document AI and Image Generation need a Google Gemini key, because they use Google embeddings and Google image models.',
  },
  {
    question: 'What can Nevatal do?',
    answer: `Nevatal bundles ${ALL_TOOLS.length} tools: ${ALL_TOOLS.map((tool) => tool.name).join(
      ', '
    )}. Each one is a dedicated page rather than a prompt you have to remember.`,
  },
  {
    question: 'Can I run Nevatal on my own server?',
    answer:
      'Yes. The whole stack — a React frontend and a Django backend — ships as Docker images, and docker compose up --build brings it up locally. The source is on GitHub.',
  },
  {
    question: 'Does Nevatal keep my documents?',
    answer:
      'Documents you upload to Document AI are indexed and kept on the server so that follow-up questions do not have to re-embed the file. They are scoped to your API key, and you can delete any of them from the Document AI page.',
  },
];

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

const NAV_LINKS = [
  { href: '#tools', label: 'Tools' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#security', label: 'Your key' },
  { href: '#faq', label: 'FAQ' },
];

const CheckIcon: React.FC = () => (
  <svg
    className="h-5 w-5 flex-none text-blue-400"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415l2.792 2.793 6.793-6.793a1 1 0 011.415 0z"
      clipRule="evenodd"
    />
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onKeySubmit }) => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script
        type="application/ld+json"
        // The FAQ markup has to match the FAQ on the page; both come from FAQS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      <a
        href="#get-started"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to the API key form
      </a>

      <header className="bg-gray-900 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            className="flex h-16 items-center justify-between gap-4"
            aria-label="Main"
          >
            <a href="#top" className="flex items-center gap-2 font-bold">
              <img
                src="/logo.png"
                alt="Nevatal logo"
                width={32}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-lg">Nevatal</span>
            </a>

            <ul className="hidden md:flex items-center gap-6 text-sm text-gray-300">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline text-sm text-gray-300 hover:text-white"
              >
                GitHub
              </a>
              <a
                href="#get-started"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold hover:bg-blue-500"
              >
                Add your key
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* Hero: the pitch and the thing you have to do, side by side. */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1 text-xs text-gray-300">
                Open source · Bring your own key
              </p>

              <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">
                {ALL_TOOLS.length} focused AI tools, running on your own API key
              </h1>

              <p className="mt-5 text-lg text-gray-300">
                Nevatal is a single workspace for writing, translation,
                summarising, document Q&amp;A and image generation. Connect an
                OpenAI, Google Gemini or OpenRouter key and every tool is
                immediately yours — no subscription, no per-seat pricing, no
                middleman holding your credentials.
              </p>

              <ul className="mt-8 space-y-3 text-gray-200">
                {[
                  'Your key is encrypted before it leaves the browser and kept in an httpOnly cookie.',
                  'You are billed by your provider at their rates. Nevatal adds nothing.',
                  'Purpose-built forms per task instead of one blank chat box.',
                  'Self-hostable: two Docker images and a compose file.',
                ].map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckIcon />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#get-started"
                  className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold hover:bg-blue-500"
                >
                  Add your API key
                </a>
                <a
                  href="#tools"
                  className="rounded-md border border-gray-600 px-5 py-2.5 font-semibold text-gray-200 hover:border-gray-400 hover:text-white"
                >
                  See the tools
                </a>
              </div>
            </div>

            <div id="get-started" className="scroll-mt-20">
              <ApiKeyForm onKeySubmit={onKeySubmit} />
            </div>
          </div>
        </section>

        {/* Tools — generated from the same list the app routes on, so this
            section cannot advertise a tool that does not exist. */}
        <section id="tools" className="scroll-mt-16 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything in the workspace
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              {ALL_TOOLS.length} tools, grouped by what you are trying to get
              done. Each one is a small form with the options that matter for
              that job, and every result is saved to your session history.
            </p>

            {/* One even grid rather than a row per group: the groups have two
                to four tools each and would leave half-empty rows. */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_GROUPS.flatMap((group) =>
                group.tools.map((tool) => (
                  <article
                    key={tool.path}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {group.name}
                    </p>
                    <h3 className="mt-2 font-semibold text-gray-900">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {tool.description}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16 bg-gray-50 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="security" className="scroll-mt-16 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Your key, handled properly
              </h2>
              <p className="mt-3 text-gray-600">
                An API key is a payment instrument. Nevatal treats it like one:
                it is encrypted in the browser before it is sent, and the
                browser never keeps a copy.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  {
                    title: 'Encrypted before it is sent',
                    body: 'The browser fetches the backend\'s RSA public key and encrypts your key with WebCrypto (RSA-OAEP, SHA-256). The proxy, the tunnel and any request log in between only ever see ciphertext.',
                  },
                  {
                    title: 'Held in an httpOnly cookie',
                    body: "Once validated, the key lives in an httpOnly cookie encrypted with the server's secret. JavaScript on the page cannot read it back, and it is never placed in localStorage.",
                  },
                  {
                    title: 'Removed whenever you want',
                    body: '"Clear API key" in the top bar drops the session cookie. Nothing about your key survives it.',
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <CheckIcon />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-semibold">Which key do I need?</h3>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-gray-900">
                    Any provider — OpenAI, Google Gemini or OpenRouter
                  </dt>
                  <dd className="mt-1 text-gray-600">
                    Works for every text tool: Prompt, Explainer, Writer,
                    Rewriter, Proofreader, Summarizer, Copywriting, Email
                    Builder, Translator and Sentiment Analysis.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">
                    Google Gemini only
                  </dt>
                  <dd className="mt-1 text-gray-600">
                    Document AI builds its search index with Google embeddings
                    and Image Generation uses Google's image model, so both
                    need a Gemini key.
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-sm text-gray-500">
                Prefer to keep everything in-house? Nevatal is MIT licensed and
                runs on your own hardware with{' '}
                <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">
                  docker compose up --build
                </code>
                .
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 bg-gray-50 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {faq.question}
                      <span
                        className="text-gray-400 transition-transform group-open:rotate-45"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready when your key is
            </h2>
            <p className="mt-3 text-gray-600">
              Paste a provider key and the whole workspace opens. Nothing to
              install, nothing to sign up for.
            </p>
            <a
              href="#get-started"
              className="mt-8 inline-block rounded-md bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Add your API key
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              width={24}
              height={18}
              className="h-5 w-auto"
            />
            <span className="text-sm">
              Nevatal — an open source AI tools hub. MIT licensed.
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a href={SITE_URL} className="hover:text-white">
              Home
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Source on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
