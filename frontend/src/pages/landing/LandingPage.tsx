import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiKeyForm from './ApiKeyForm';
import SlideReveal from './SlideReveal';
import CourseCard from '../../components/CourseCard';
import { COURSES } from '../../courses/catalog';
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
    question: 'Can I learn to use the tools without an API key?',
    answer: 'Yes. The Courses section has free, self-paced lessons on prompting, writing, business content, translation, documents, images and data workflows. Every lesson includes an example, an exercise and checks for the result. You only need a provider API key when you want to run an exercise in a tool.',
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
  { href: '#simulator', label: 'Live Demo' },
  { href: '#why-byok', label: 'Why BYOK' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#security', label: 'Security' },
  { href: '#courses', label: 'Courses' },
  { href: '#faq', label: 'FAQ' },
];

/** Slide show sections configuration */
interface SlideSectionInfo {
  id: string;
  number: string;
  title: string;
  badge: string;
}

const LANDING_SLIDES: SlideSectionInfo[] = [
  { id: 'top', number: '01', title: 'Overview', badge: 'Slide 01 · Workspace Overview' },
  { id: 'simulator', number: '02', title: 'Live Demo', badge: 'Slide 02 · Interactive Preview' },
  { id: 'why-byok', number: '03', title: 'Why BYOK', badge: 'Slide 03 · Cost Transparency' },
  { id: 'tools', number: '04', title: '17 Tools', badge: 'Slide 04 · 17 Purpose-Built Tools' },
  { id: 'how-it-works', number: '05', title: 'How It Works', badge: 'Slide 05 · 3-Step Execution' },
  { id: 'security', number: '06', title: 'Security', badge: 'Slide 06 · End-to-End Cryptography' },
  { id: 'courses', number: '07', title: 'Courses', badge: 'Slide 07 · Free Academy' },
  { id: 'faq', number: '08', title: 'FAQ', badge: 'Slide 08 · Questions & Answers' },
  { id: 'cta-launch', number: '09', title: 'Get Started', badge: 'Slide 09 · Connect & Launch' },
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

const getToolIcon = (path: string) => {
  switch (path) {
    case '/prompt':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case '/explainer':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case '/writer':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case '/rewriter':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case '/proofreader':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case '/summarizer':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
        </svg>
      );
    case '/copywriting':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case '/email-builder':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case '/social-caption':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      );
    case '/ideas':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case '/translator':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    case '/sentiment':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case '/document-ai':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case '/image-generation':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case '/data-analysis':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case '/data-formatter':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16M9 4v16" />
        </svg>
      );
    case '/batch':
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
};

const getCategoryBadgeClass = (categoryName: string) => {
  switch (categoryName) {
    case 'Ask & explain':
      return 'text-blue-700 bg-blue-50 border-blue-200/80';
    case 'Write & edit':
      return 'text-violet-700 bg-violet-50 border-violet-200/80';
    case 'Business':
      return 'text-amber-700 bg-amber-50 border-amber-200/80';
    case 'Language & analysis':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200/80';
    case 'Documents & media':
      return 'text-cyan-700 bg-cyan-50 border-cyan-200/80';
    case 'Data & bulk':
      return 'text-rose-700 bg-rose-50 border-rose-200/80';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};

/** Interactive Live Demo Showcase configurations */
interface SimulatorItem {
  id: string;
  name: string;
  badge: string;
  iconText: string;
  query: string;
  model: string;
  latency: string;
  tokens: string;
  cost: string;
  result: string;
}

const SIMULATOR_DEMOS: SimulatorItem[] = [
  {
    id: 'prompt',
    name: 'Prompt & Chat',
    badge: 'Universal',
    iconText: '💬',
    query: 'Explain how client-side WebCrypto RSA encryption keeps my API key secure.',
    model: 'OpenRouter (Claude 3.5 Sonnet / GPT-4o)',
    latency: '340ms',
    tokens: '168 tokens',
    cost: '$0.0005',
    result: `Nevatal uses the browser's native **WebCrypto API** to encrypt your raw API key with the backend's RSA-OAEP public key (2048-bit with SHA-256) *before* the HTTP request is even dispatched.

🔒 **Why this matters**:
1. **Zero-plaintext transit**: Intermediary proxies, CDNs, and network logs see only encrypted ciphertext.
2. **Ephemeral decrypt**: The backend decrypts the payload in RAM solely to validate it with the provider.
3. **httpOnly session**: Stored in a cryptographically secured cookie inaccessible to JavaScript and XSS.`,
  },
  {
    id: 'document-ai',
    name: 'Document AI',
    badge: 'Gemini',
    iconText: '📄',
    query: 'What was the Q3 operating margin and customer expansion rate in this quarterly filing?',
    model: 'Google Gemini 1.5 Pro',
    latency: '580ms',
    tokens: '245 tokens',
    cost: '$0.0003',
    result: `Based on **Section 4.1 (Financial Highlights, Page 12)**:

- **Operating Margin**: Expanded to **28.4%** (up 310 bps year-over-year).
- **Net Revenue Retention**: **118.2%**, driven by cross-platform enterprise adoption.
- **Customer Expansion**: 41 new Fortune 500 accounts added in Q3.

*Source: 10-Q filing, Table 3.4 'Consolidated Results of Operations'*`,
  },
  {
    id: 'writer',
    name: 'Writer',
    badge: 'Universal',
    iconText: '✍️',
    query: 'Brief: Executive announcement introducing Nevatal open source workspace to engineering staff.',
    model: 'OpenAI GPT-4o',
    latency: '410ms',
    tokens: '290 tokens',
    cost: '$0.0007',
    result: `### Team Update: Deploying Nevatal AI Workspace

Team,

To provide high-performance generative AI tools without per-seat licensing or compliance risk, we have deployed **Nevatal** across our infrastructure.

**Key Highlights**:
- **Zero middleman data retention**: All requests run against our vetted enterprise API keys.
- **17 specialized tools**: Dedicated forms for data analysis, translation, documentation, and drafting.
- **Self-hosted**: Packaged as lightweight Docker containers for predictable local execution.`,
  },
  {
    id: 'rewriter',
    name: 'Rewriter',
    badge: 'Universal',
    iconText: '🔄',
    query: 'Tone goal: Turn informal engineering notes into crisp client-facing release notes.',
    model: 'OpenRouter (Claude 3.5 Haiku)',
    latency: '260ms',
    tokens: '175 tokens',
    cost: '$0.0001',
    result: `**Nevatal v2.4 Release Notes**:

- **Enhanced Performance**: Optimized token streaming pipeline, reducing initial response latency by 35%.
- **Streamlined Workflow**: Added multi-model hot-switching for OpenRouter subscribers.
- **Hardened Security**: Upgraded session handshake to WebCrypto RSA-OAEP with SHA-256.`,
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    badge: 'Universal',
    iconText: '📊',
    query: 'Analyze user query distribution CSV across 15,000 monthly executions.',
    model: 'Google Gemini 1.5 Flash',
    latency: '490ms',
    tokens: '310 tokens',
    cost: '$0.0002',
    result: `### Dataset Insights (15,000 requests sampled)

| Tool Category | Share (%) | Avg. Response (s) | Cost per Run |
| :--- | :--- | :--- | :--- |
| **Write & Edit** | 38.4% | 0.82s | $0.0004 |
| **Ask & Explain** | 26.1% | 0.54s | $0.0002 |
| **Document AI** | 19.5% | 1.15s | $0.0006 |
| **Data & Bulk** | 16.0% | 0.95s | $0.0005 |

💡 **Key Takeaway**: 64.5% of total volume is handled by low-latency lightweight models, yielding an effective **94% cost reduction** compared to flat $20/user SaaS subscriptions.`,
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onKeySubmit }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<string>('prompt');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedSecurityStep, setSelectedSecurityStep] = useState<number>(0);
  const [monthlyTaskVolume, setMonthlyTaskVolume] = useState<number>(400);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Scrollspy observer to detect active slide in slideshow
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = LANDING_SLIDES.findIndex((s) => s.id === entry.target.id);
            if (index !== -1) {
              setActiveSlideIndex(index);
            }
          }
        });
      },
      { threshold: 0.25, rootMargin: '-80px 0px -20% 0px' }
    );

    LANDING_SLIDES.forEach((slide) => {
      const el = document.getElementById(slide.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSlide = (slideId: string) => {
    const el = document.getElementById(slideId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNextSlide = () => {
    const nextIndex = (activeSlideIndex + 1) % LANDING_SLIDES.length;
    scrollToSlide(LANDING_SLIDES[nextIndex].id);
  };

  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const group = TOOL_GROUPS.find((g) => g.tools.some((t) => t.path === tool.path));
      const groupName = group ? group.name : '';
      
      const matchesCategory = selectedCategory === 'All' || groupName === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || groupName.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Current active simulator item
  const currentDemo = SIMULATOR_DEMOS.find((d) => d.id === activeSimulatorTab) || SIMULATOR_DEMOS[0];

  // BYOK vs SaaS cost calculation
  const saasMonthlyCost = 20.00;
  const byokMonthlyCost = Number((monthlyTaskVolume * 0.0006).toFixed(2));
  const estimatedSavings = Math.max(0, Number((saasMonthlyCost - byokMonthlyCost).toFixed(2)));
  const percentageSaved = Math.round(((saasMonthlyCost - byokMonthlyCost) / saasMonthlyCost) * 100);

  const securitySteps = [
    {
      step: '01',
      title: 'Browser WebCrypto Encryption',
      summary: 'Encrypted client-side before dispatch',
      detail: "The browser fetches the backend's RSA-2048 public key and encrypts your API key using WebCrypto (RSA-OAEP with SHA-256). The plaintext never touches the network.",
    },
    {
      step: '02',
      title: 'Encrypted TLS Transit',
      summary: 'Ciphertext only across the wire',
      detail: 'Reverse proxies, load balancers, cloud firewalls, and server access logs can inspect traffic but only observe high-entropy asymmetric ciphertext.',
    },
    {
      step: '03',
      title: 'Ephemeral RAM Validation',
      summary: 'Validated directly with provider',
      detail: "The backend uses its private RSA key in memory to temporarily decrypt the key and test its validity against your chosen provider's authentication endpoint.",
    },
    {
      step: '04',
      title: 'HttpOnly Secure Session',
      summary: 'Inaccessible to browser scripts',
      detail: "Once validated, the session key lives in an httpOnly AES-encrypted cookie. JavaScript on the page cannot read it, blocking XSS leaks. 'Clear API key' drops it instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-500 selection:text-white relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      <a
        href="#get-started"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-blue-600 focus:px-4 focus:py-2.5 focus:text-white focus:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Skip to the API key form
      </a>

      {/* Floating Presentation Slide Show Navigator (Desktop) */}
      <aside 
        aria-label="Slide Show Navigation"
        className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-2.5 pointer-events-auto"
      >
        <div className="bg-gray-950/80 backdrop-blur-xl border border-gray-800/90 py-3 px-2 rounded-2xl shadow-2xl flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 font-bold tracking-wider px-1">
            {LANDING_SLIDES[activeSlideIndex].number}/09
          </span>

          <div className="w-4 h-px bg-gray-800 my-0.5" />

          {LANDING_SLIDES.map((slide, idx) => {
            const isActive = activeSlideIndex === idx;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollToSlide(slide.id)}
                className="group relative flex items-center justify-center p-1.5 focus:outline-none"
                aria-label={`Go to slide ${slide.number}: ${slide.title}`}
              >
                {/* Dot indicator */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-3 h-3 bg-blue-500 shadow-md shadow-blue-500/50 scale-125'
                      : 'w-2 h-2 bg-gray-700 hover:bg-gray-400'
                  }`}
                />

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute right-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-gray-200 text-xs font-medium py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl border border-gray-700/80">
                  {slide.number}. {slide.title}
                </span>
              </button>
            );
          })}

          <div className="w-4 h-px bg-gray-800 my-0.5" />

          {/* Next Slide Advance Button */}
          <button
            type="button"
            onClick={handleNextSlide}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Next Slide"
            aria-label="Advance to next slide"
          >
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Floating Slide Indicator Pill */}
      <div className="fixed bottom-4 right-4 z-40 xl:hidden">
        <button
          type="button"
          onClick={handleNextSlide}
          className="flex items-center gap-2 bg-gray-950/90 backdrop-blur-md border border-gray-700/80 text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-2xl"
          aria-label="Next slide"
        >
          <span className="text-blue-400 font-mono font-bold">Slide {LANDING_SLIDES[activeSlideIndex].number}</span>
          <span className="text-gray-400">·</span>
          <span className="truncate max-w-[90px]">{LANDING_SLIDES[activeSlideIndex].title}</span>
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/85 border-b border-gray-800/80 text-white transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            className="flex h-16 sm:h-20 items-center justify-between gap-4"
            aria-label="Main"
          >
            {/* Logo */}
            <a href="#top" className="flex items-center gap-2.5 font-bold tracking-tight text-white group">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <img
                  src="/logo.png"
                  alt="Nevatal logo"
                  width={32}
                  height={24}
                  className="h-5 w-auto object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Nevatal
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <ul className="hidden lg:flex items-center gap-7 text-sm font-medium text-gray-300">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-blue-500 after:transition-all after:duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/courses"
                className="hidden sm:inline-flex items-center text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
              >
                Courses
              </Link>
              <Link
                to="/about"
                className="hidden md:inline-flex items-center text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
              >
                About
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors border border-gray-800"
                aria-label="GitHub Repository"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
              <a
                href="#get-started"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Add your key
              </a>

              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </nav>

          {/* Mobile navigation drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-800 py-4 px-2 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-gray-800 flex flex-col gap-2">
                <Link
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Courses Catalog
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  About Nevatal
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main id="top">
        {/* SLIDE 01: Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-900 text-white pt-10 pb-20 lg:pt-16 lg:pb-28">
          {/* Ambient decorative glowing mesh orbs */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/25 to-purple-600/20 blur-[130px] rounded-full -z-0 opacity-80" aria-hidden="true" />
          <div className="pointer-events-none absolute top-1/3 -left-32 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -z-0" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-10 right-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full -z-0" aria-hidden="true" />

          {/* Background grid */}
          <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none -z-0" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Slides in smoothly from left */}
              <div className="lg:col-span-7 space-y-6">
                <SlideReveal direction="left" delay={50}>
                  {/* Slide Show Category Pill */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-blue-200 shadow-inner shadow-blue-500/20">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span>{LANDING_SLIDES[0].badge}</span>
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                    {ALL_TOOLS.length} focused AI tools, running on your own API key
                  </h1>
                </SlideReveal>

                <SlideReveal direction="up" delay={150}>
                  <p className="text-lg sm:text-xl text-gray-300 font-normal leading-relaxed max-w-2xl">
                    Nevatal is a private workspace for writing, translation,
                    document Q&amp;A, data analysis, and generative vision. Connect an
                    OpenAI, Google Gemini or OpenRouter key and every tool is
                    immediately yours — no subscription, no per-seat pricing, and no
                    middleman retaining your data.
                  </p>
                </SlideReveal>

                {/* Value Checklist */}
                <SlideReveal direction="up" delay={250}>
                  <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200 pt-2">
                    {[
                      'Client-side RSA-OAEP encryption before leaving your browser',
                      'Pay your provider direct wholesale rates with 0% Nevatal markup',
                      '17 purpose-built forms tailored to tasks instead of blank prompts',
                      'Self-hostable via Docker Compose in under two minutes',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 bg-gray-900/50 backdrop-blur-sm border border-gray-800/80 rounded-xl p-3">
                        <div className="mt-0.5"><CheckIcon /></div>
                        <span className="leading-snug text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </SlideReveal>

                {/* CTA button cluster */}
                <SlideReveal direction="up" delay={350}>
                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <a
                      href="#get-started"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <span>Add your API key</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </a>

                    <a
                      href="#simulator"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 px-5 py-3.5 text-base font-semibold text-gray-200 hover:border-gray-500 hover:text-white transition-all duration-200"
                    >
                      <span>Try Interactive Demo</span>
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </a>

                    <a
                      href="#tools"
                      className="text-sm font-medium text-gray-400 hover:text-white px-2 py-1 transition-colors"
                    >
                      Browse all {ALL_TOOLS.length} tools →
                    </a>
                  </div>
                </SlideReveal>

                {/* Quick stats counter bar */}
                <SlideReveal direction="up" delay={450}>
                  <div className="pt-6 border-t border-gray-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-white">17</div>
                      <div className="text-xs text-gray-400 mt-0.5">Specialized Tools</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">3</div>
                      <div className="text-xs text-gray-400 mt-0.5">Leading Providers</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">0%</div>
                      <div className="text-xs text-gray-400 mt-0.5">Surcharge Markup</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">100%</div>
                      <div className="text-xs text-gray-400 mt-0.5">Free & Open Source</div>
                    </div>
                  </div>
                </SlideReveal>
              </div>

              {/* Right Column: Slides in smoothly from right */}
              <div id="get-started" className="lg:col-span-5 scroll-mt-24">
                <SlideReveal direction="right" delay={200}>
                  <ApiKeyForm onKeySubmit={onKeySubmit} />
                </SlideReveal>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 02: Interactive Live Playground / Simulator Section */}
        <section id="simulator" className="scroll-mt-20 py-16 lg:py-24 bg-gray-900 border-b border-gray-800 text-white relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  ⚡ {LANDING_SLIDES[1].badge}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                  Preview the workspace before entering a key
                </h2>
                <p className="mt-3 text-base text-gray-400">
                  Experience how dedicated input fields and streaming output beat blank prompt chatboxes. Click through live tool scenarios below.
                </p>
              </div>
            </SlideReveal>

            {/* Interactive Tab Switcher */}
            <SlideReveal direction="up" delay={150}>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {SIMULATOR_DEMOS.map((demo) => {
                  const isActive = activeSimulatorTab === demo.id;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => setActiveSimulatorTab(demo.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/60'
                      }`}
                    >
                      <span>{demo.iconText}</span>
                      <span>{demo.name}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-500/60 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {demo.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SlideReveal>

            {/* Terminal Window Mockup */}
            <SlideReveal direction="scale" delay={250}>
              <div className="max-w-4xl mx-auto rounded-2xl border border-gray-700/80 bg-gray-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-800 bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                    <span className="ml-2 text-xs font-mono text-gray-400 hidden sm:inline">nevatal-workspace://{currentDemo.id}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Preview
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md font-mono text-[11px]">
                      {currentDemo.model}
                    </span>
                  </div>
                </div>

                {/* Window Body: Split Query / Result */}
                <div className="p-5 sm:p-7 space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-semibold uppercase tracking-wider text-blue-400">Input Brief</span>
                      <span className="font-mono">{currentDemo.tokens}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 text-sm font-mono text-gray-200">
                      {currentDemo.query}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Generated Output
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
                        <span>Latency: {currentDemo.latency}</span>
                        <span>Est. Cost: <strong className="text-emerald-400">{currentDemo.cost}</strong></span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 rounded-xl bg-gray-900/60 border border-gray-800 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap font-sans">
                      {currentDemo.result}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-gray-800/80">
                    <div className="text-gray-400">
                      Each generation records to session history and stays completely private to your key.
                    </div>
                    <a
                      href="#get-started"
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      <span>Run this tool with your key</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>
            </SlideReveal>
          </div>
        </section>

        {/* SLIDE 03: "Why BYOK?" Section */}
        <section id="why-byok" className="scroll-mt-16 py-16 lg:py-24 bg-white text-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  💰 {LANDING_SLIDES[2].badge}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                  Why Bring-Your-Own-Key (BYOK) saves 90%+
                </h2>
                <p className="mt-3 text-base sm:text-lg text-gray-600">
                  Most AI wrappers charge $20 to $40 per user every month, even when you only run a few tasks. With Nevatal, you pay your provider directly for the exact fractions of a cent your tokens cost.
                </p>
              </div>
            </SlideReveal>

            {/* Side-by-side comparison cards: Left slides from left, Right slides from right */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Traditional SaaS Card */}
              <SlideReveal direction="left" delay={100} className="h-full">
                <div className="h-full rounded-2xl border border-gray-200 bg-gray-50/70 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 mb-4">
                      Traditional AI Subscriptions
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">$20 – $40 <span className="text-sm font-normal text-gray-500">/ user / month</span></h3>
                    <p className="mt-2 text-sm text-gray-600">
                      You pay the full flat rate regardless of whether you generate 5 articles or 500.
                    </p>

                    <ul className="mt-6 space-y-3 text-sm text-gray-600">
                      <li className="flex items-start gap-2.5">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>High monthly recurring overhead for teams and individuals</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Locked into whichever single model the vendor supports</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Your prompts and documents pass through and persist on third-party servers</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>Hidden rate limits, usage throttles, and sudden plan changes</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Typical annual spend per seat: <strong>$240 – $480</strong>
                  </div>
                </div>
              </SlideReveal>

              {/* Nevatal BYOK Card */}
              <SlideReveal direction="right" delay={150} className="h-full">
                <div className="h-full relative rounded-2xl border-2 border-blue-600 bg-white p-6 sm:p-8 shadow-xl flex flex-col justify-between">
                  <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    Nevatal BYOK
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
                      Direct Wholesale API Rates
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">$0.00 <span className="text-sm font-normal text-gray-500">subscription + wholesale token pennies</span></h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Pay only your chosen provider (OpenAI, Gemini, OpenRouter) for exact tokens consumed.
                    </p>

                    <ul className="mt-6 space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-2.5">
                        <CheckIcon />
                        <span><strong>0% markup</strong>: Pay fractions of a cent per task (e.g. $0.0004 for a summary)</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckIcon />
                        <span><strong>Complete model freedom</strong>: Access GPT-4o, Claude 3.5 Sonnet, Gemini 1.5, Llama 3</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckIcon />
                        <span><strong>Zero knowledge privacy</strong>: Keys encrypted in browser; no prompt harvesting</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckIcon />
                        <span><strong>MIT open source</strong>: Run locally with Docker compose whenever you want</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-blue-100 flex items-center justify-between text-xs text-gray-600">
                    <span>Typical monthly spend for 400 tasks:</span>
                    <span className="text-base font-bold text-emerald-600">~$0.24</span>
                  </div>
                </div>
              </SlideReveal>
            </div>

            {/* Interactive Savings Calculator: Slides up */}
            <SlideReveal direction="up" delay={200}>
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 border border-blue-100 p-6 sm:p-8 max-w-4xl mx-auto shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Interactive Savings Estimator</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Estimate how much you save every month compared to a $20/mo subscription</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Monthly Tasks</span>
                    <div className="text-xl font-bold text-blue-700">{monthlyTaskVolume} tasks</div>
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={monthlyTaskVolume}
                  onChange={(e) => setMonthlyTaskVolume(Number(e.target.value))}
                  className="w-full h-2.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Monthly task volume slider"
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                  <span>50 tasks (Light)</span>
                  <span>400 tasks (Average)</span>
                  <span>1,000 tasks (Heavy)</span>
                  <span>2,000 tasks (Team)</span>
                </div>

                <div className="mt-6 pt-5 border-t border-blue-200/60 grid sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-white/80 rounded-xl p-3 border border-blue-100">
                    <div className="text-xs text-gray-500">SaaS Subscription</div>
                    <div className="text-xl font-bold text-gray-800">${saasMonthlyCost.toFixed(2)}/mo</div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-blue-100">
                    <div className="text-xs text-gray-500">Nevatal BYOK Cost</div>
                    <div className="text-xl font-bold text-blue-600">${byokMonthlyCost.toFixed(2)}/mo</div>
                  </div>
                  <div className="bg-emerald-100/80 rounded-xl p-3 border border-emerald-200">
                    <div className="text-xs text-emerald-800 font-medium">Estimated Monthly Savings</div>
                    <div className="text-xl font-bold text-emerald-700">${estimatedSavings.toFixed(2)} ({percentageSaved}%)</div>
                  </div>
                </div>
              </div>
            </SlideReveal>
          </div>
        </section>

        {/* SLIDE 04: Tools Catalog Section */}
        <section id="tools" className="scroll-mt-16 py-16 lg:py-24 bg-gray-50 border-t border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    🛠️ {LANDING_SLIDES[3].badge}
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                    Everything in the workspace
                  </h2>
                  <p className="mt-2 max-w-2xl text-gray-600 text-sm sm:text-base">
                    {ALL_TOOLS.length} specialized tools grouped by workflow. Each tool is a purpose-built form with tailored controls, saved automatically to session history.
                  </p>
                </div>

                {/* Search bar */}
                <div className="w-full md:w-72 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </SlideReveal>

            {/* Category Filter Pills */}
            <SlideReveal direction="up" delay={100}>
              <div className="flex flex-wrap items-center gap-2 mb-8" role="tablist" aria-label="Tool Categories">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === 'All'
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All Tools ({ALL_TOOLS.length})
                </button>

                {TOOL_GROUPS.map((group) => (
                  <button
                    key={group.name}
                    type="button"
                    onClick={() => setSelectedCategory(group.name)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === group.name
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {group.name} ({group.tools.length})
                  </button>
                ))}
              </div>
            </SlideReveal>

            {/* Tool Grid with staggered slide-in cards */}
            {filteredTools.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8">
                <p className="text-gray-500 text-sm">No tools matching "{searchQuery}".</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool, idx) => {
                  const group = TOOL_GROUPS.find((g) => g.tools.some((t) => t.path === tool.path));
                  const groupName = group ? group.name : 'Tool';
                  const badgeClass = getCategoryBadgeClass(groupName);
                  const needsGemini = tool.path === '/document-ai' || tool.path === '/image-generation';

                  return (
                    <SlideReveal
                      key={tool.path}
                      direction="up"
                      delay={(idx % 6) * 60}
                      duration={600}
                    >
                      <article
                        className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 h-full"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${badgeClass}`}>
                              {groupName}
                            </span>

                            {needsGemini ? (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded">
                                Gemini Key
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-gray-400">
                                Universal
                              </span>
                            )}
                          </div>

                          <div className="flex items-start gap-3 mt-1">
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-blue-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                              {getToolIcon(tool.path)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {tool.name}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-mono">
                          <span>{tool.path}</span>
                          <a
                            href="#get-started"
                            className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1 font-sans"
                          >
                            <span>Launch</span>
                            <span>→</span>
                          </a>
                        </div>
                      </article>
                    </SlideReveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SLIDE 05: How It Works Section */}
        <section id="how-it-works" className="scroll-mt-16 py-16 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  🚀 {LANDING_SLIDES[4].badge}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                  How Nevatal works in three steps
                </h2>
                <p className="mt-3 text-base text-gray-600">
                  Designed to eliminate prompt engineering fatigue. Connect, pick your job form, and inspect results.
                </p>
              </div>
            </SlideReveal>

            <ol className="grid gap-8 md:grid-cols-3 relative">
              {STEPS.map((step, index) => (
                <SlideReveal key={step.title} direction="up" delay={index * 150} className="h-full">
                  <li
                    className="relative rounded-2xl border border-gray-200 bg-gray-50/60 p-6 sm:p-8 flex flex-col justify-between transition-all hover:bg-white hover:shadow-lg hover:border-blue-200 h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-500/20">
                          {index + 1}
                        </span>
                        <span className="text-xs font-mono text-gray-400">Step 0{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.body}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200/60 text-xs text-blue-600 font-medium">
                      {index === 0 && 'OpenAI, Gemini or OpenRouter supported'}
                      {index === 1 && '17 dedicated, specialized UI forms'}
                      {index === 2 && 'Complete session history & export'}
                    </div>
                  </li>
                </SlideReveal>
              ))}
            </ol>
          </div>
        </section>

        {/* SLIDE 06: Security Section */}
        <section id="security" className="scroll-mt-16 py-16 lg:py-24 bg-gray-900 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute top-10 right-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" aria-hidden="true" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Security Philosophy & Interactive Pipeline */}
              <div className="lg:col-span-7 space-y-6">
                <SlideReveal direction="left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    🛡️ {LANDING_SLIDES[5].badge}
                  </span>

                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">
                    Your key, handled properly
                  </h2>

                  <p className="text-base sm:text-lg text-gray-300 leading-relaxed mt-3">
                    An API key is a financial credential tied to your payment method.
                    Nevatal treats it like one: it is encrypted inside the browser with
                    RSA-OAEP before dispatch, and the browser never writes it to localStorage.
                  </p>
                </SlideReveal>

                {/* 4-Step Interactive Security Architecture */}
                <SlideReveal direction="up" delay={150}>
                  <div className="mt-6 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Interactive Encryption Pipeline (Click to inspect)
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {securitySteps.map((step, idx) => {
                        const isSelected = selectedSecurityStep === idx;
                        return (
                          <button
                            key={step.step}
                            type="button"
                            onClick={() => setSelectedSecurityStep(idx)}
                            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/30'
                                : 'bg-gray-800/60 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono mb-1">
                              <span className={isSelected ? 'text-blue-400 font-bold' : 'text-gray-400'}>
                                {step.step}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {idx === 0 ? 'WebCrypto' : idx === 1 ? 'TLS' : idx === 2 ? 'RAM' : 'Cookie'}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{step.summary}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Step Deep Dive Box */}
                    <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gray-950 border border-blue-500/30 text-sm leading-relaxed text-gray-300 animate-fadeIn">
                      <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wide mb-1.5">
                        <span>Step Detail</span>
                        <span>·</span>
                        <span>{securitySteps[selectedSecurityStep].title}</span>
                      </div>
                      {securitySteps[selectedSecurityStep].detail}
                    </div>
                  </div>
                </SlideReveal>
              </div>

              {/* Right Column: Key Guide Card */}
              <div className="lg:col-span-5">
                <SlideReveal direction="right" delay={200}>
                  <div className="rounded-2xl border border-gray-800 bg-gray-800/60 backdrop-blur-xl p-6 sm:p-8 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Which key do I need?</h3>
                      <p className="mt-1 text-xs text-gray-400">All tools operate without per-seat platform fees.</p>
                    </div>

                    <dl className="space-y-4 text-sm">
                      <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
                        <dt className="font-semibold text-blue-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Any Provider — OpenAI, Google Gemini or OpenRouter
                        </dt>
                        <dd className="mt-1 text-xs sm:text-sm text-gray-300">
                          Works across every text tool: Prompt, Explainer, Writer, Rewriter, Proofreader, Summarizer, Copywriting, Email Builder, Translator and Sentiment Analysis.
                        </dd>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
                        <dt className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Google Gemini Key
                        </dt>
                        <dd className="mt-1 text-xs sm:text-sm text-gray-300">
                          Document AI uses Google embeddings for document vector index search, and Image Generation runs Google's Imagen model. Both require Gemini keys.
                        </dd>
                      </div>
                    </dl>

                    <div className="pt-4 border-t border-gray-700/80">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Prefer complete infrastructure autonomy? Nevatal is MIT licensed and runs on your own hardware or VPS with:
                      </p>
                      <code className="block mt-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-mono text-blue-300 border border-gray-800">
                        docker compose up --build
                      </code>
                    </div>
                  </div>
                </SlideReveal>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 07: Courses Section */}
        <section id="courses" className="scroll-mt-16 border-t border-gray-200 py-16 lg:py-24 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    🎓 {LANDING_SLIDES[6].badge}
                  </span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                    A little practice goes a long way
                  </h2>
                  <p className="mt-2 max-w-2xl text-gray-600 text-sm sm:text-base">
                    Free self-paced courses with practical examples, exercises, and automated result checks. Read and learn every lesson without an API key.
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Explore all {COURSES.length} courses</span>
                  <span>→</span>
                </Link>
              </div>
            </SlideReveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {COURSES.slice(0, 3).map((course, idx) => (
                <SlideReveal key={course.slug} direction="up" delay={idx * 150} className="h-full">
                  <CourseCard course={course} />
                </SlideReveal>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 08: FAQ Section */}
        <section id="faq" className="scroll-mt-16 bg-white py-16 lg:py-24 border-t border-gray-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SlideReveal direction="up">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  ❓ {LANDING_SLIDES[7].badge}
                </span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                  Frequently asked questions
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  Clear answers regarding privacy, billing, provider compatibility, and deployment.
                </p>
              </div>
            </SlideReveal>

            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <SlideReveal key={faq.question} direction="up" delay={index * 40}>
                    <details
                      className="group py-5 transition-all"
                      open={isOpen}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenFaqIndex(isOpen ? null : index);
                      }}
                    >
                      <summary className="cursor-pointer list-none font-semibold text-gray-900 marker:content-none text-base sm:text-lg flex items-center justify-between gap-4 select-none">
                        <span>{faq.question}</span>
                        <span
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 bg-blue-50 text-blue-600 border-blue-200' : 'group-hover:border-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </details>
                  </SlideReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* SLIDE 09: Final CTA Banner */}
        <section id="cta-launch" className="scroll-mt-16 relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 py-16 lg:py-24 text-white">
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full" aria-hidden="true" />
          
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <SlideReveal direction="scale">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-200 border border-blue-700/50">
                ✨ {LANDING_SLIDES[8].badge}
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-3">
                Start using your private AI workspace today
              </h2>

              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mt-4">
                Paste an OpenAI, Gemini or OpenRouter key to unlock all {ALL_TOOLS.length} focused tools. No credit card, no registration, and zero subscription markup.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <a
                  href="#get-started"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 font-semibold text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Add your API key
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-700 bg-gray-800/80 px-6 py-4 font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Star on GitHub</span>
                </a>
              </div>
            </SlideReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Nevatal logo"
              width={24}
              height={18}
              className="h-5 w-auto"
            />
            <span className="text-sm text-gray-300">
              Nevatal — an open source AI tools hub. MIT licensed.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a href={SITE_URL} className="hover:text-white transition-colors">
              Home
            </a>
            <Link to="/courses" className="hover:text-white transition-colors">
              Courses
            </Link>
            <Link to="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
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
