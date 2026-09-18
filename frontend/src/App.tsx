import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import services, { onHistoryChanged } from './services/services';
import { clearConversations, clearLegacyApiKey, getLegacyApiKey } from './services/auth';
import type { HistoryEntry } from './interface';
import { ALL_TOOLS, DEFAULT_TOOL_PATH } from './tools';
import { MODEL_STORAGE_KEY, PROVIDER_STORAGE_KEY } from './constant';
import { applyPageMetadata, isPublicContentPath } from './seo';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import SpendAlert from './components/SpendAlert';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/landing/LandingPage';

// The tool pages load on demand. They are only reachable once someone has
// signed in. The public course pages have their own chunk, with static HTML
// generated at build time so their content can also be read without JavaScript.
const PublicPages = lazy(() => import('./pages/public/PublicPages'));
const PromptPage = lazy(() => import('./pages/ai-service-page/PromptPage'));
const ProofreaderPage = lazy(() => import('./pages/ai-service-page/ProofreaderPage'));
const RewriterPage = lazy(() => import('./pages/ai-service-page/RewriterPage'));
const SummarizerPage = lazy(() => import('./pages/ai-service-page/SummarizerPage'));
const TranslatorPage = lazy(() => import('./pages/ai-service-page/TranslatorPage'));
const WriterPage = lazy(() => import('./pages/ai-service-page/WriterPage'));
const CopyWritingPage = lazy(() => import('./pages/ai-service-page/CopyWritingPage'));
const ExplainerPage = lazy(() => import('./pages/ai-service-page/ExplainerPage'));
const SentimentPage = lazy(() => import('./pages/ai-service-page/SentimentPage'));
const DocumentAIPage = lazy(() => import('./pages/ai-service-page/DocumentAIPage'));
const ImaGenPage = lazy(() => import('./pages/ai-service-page/ImaGenPage'));
const EmailBuilderPage = lazy(() => import('./pages/ai-service-page/EmailBuilderPage'));
const PostGeneratorPage = lazy(() => import('./pages/ai-service-page/PostGenerator'));
const IdeaGeneratorPage = lazy(() => import('./pages/ai-service-page/IdeaGenerator'));
const DataFormatterPage = lazy(() => import('./pages/ai-service-page/DataFormatter'));
const DataAnalysisPage = lazy(() => import('./pages/ai-service-page/DataAnalysis'));
const BatchPage = lazy(() => import('./pages/ai-service-page/BatchPage'));
const UsagePage = lazy(() => import('./pages/ai-service-page/UsagePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const MemoryPage = lazy(() => import('./pages/MemoryPage'));
/** Shown while a tool's chunk is on its way. */
const ToolLoading = () => (
  <div className="h-full flex items-center justify-center">
    <span
      role="status"
      aria-label="Loading"
      className="h-7 w-7 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin"
    />
  </div>
);

function App() {
  const { pathname, state } = useLocation();
  const [hasApiKey, setHasApiKey] = useState(false);
  // The session check is a round trip; without this the API key form flashes
  // on every reload before we know the user is already signed in.
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [provider, setProvider] = useState(
    () => localStorage.getItem(PROVIDER_STORAGE_KEY) || ''
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const historyRequest = useRef(0);
  // Below `md` the sidebar is a drawer, so it has to be opened deliberately.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        await services.checkApiKeySession();
        if (!isMounted) return;
        clearLegacyApiKey();
        setHasApiKey(true);
        return;
      } catch {
        // No cookie session yet — fall through to the legacy migration path.
      }

      const legacyKey = getLegacyApiKey();
      if (legacyKey) {
        try {
          await services.validateApiKey(legacyKey);
          clearLegacyApiKey();
          if (isMounted) setHasApiKey(true);
        } catch {
          clearLegacyApiKey();
        }
      }
    };

    void bootstrapAuth().finally(() => {
      if (isMounted) setIsBootstrapping(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshHistory = useCallback(async () => {
    const request = ++historyRequest.current;
    setIsHistoryLoading(true);
    setHistoryError('');
    try {
      const entries = await services.getHistory();
      if (request === historyRequest.current) setHistory(entries);
    } catch {
      if (request === historyRequest.current) setHistoryError('Could not load saved history.');
    } finally {
      if (request === historyRequest.current) setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasApiKey) return;
    void refreshHistory();
    // Each completed generation writes a row server-side; refetch so the
    // sidebar reflects what the user just did.
    const unsubscribe = onHistoryChanged(() => {
      void refreshHistory();
    });
    return () => { unsubscribe(); historyRequest.current += 1; };
  }, [hasApiKey, refreshHistory]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    applyPageMetadata(pathname);
  }, [pathname]);

  const handleKeySubmission = (selectedProvider: string) => {
    setProvider(selectedProvider);
    setHasApiKey(true);
  };

  const handleClearKey = async () => {
    try {
      await services.clearApiKeySession();
    } catch (error) {
      console.error('Failed to clear the API key session:', error);
    } finally {
      clearLegacyApiKey();
      clearConversations();
      localStorage.removeItem(PROVIDER_STORAGE_KEY);
      // The next key may be for a provider — or a plan — where this model does
      // not exist, so the choice goes with the key it was made for.
      localStorage.removeItem(MODEL_STORAGE_KEY);
      setProvider('');
      historyRequest.current += 1;
      setHistory([]);
      setHistoryError('');
      setIsHistoryLoading(false);
      setHasApiKey(false);
    }
  };

  // The landing page is the public, indexable page, so it paints before the
  // session check comes back rather than behind the loading spinner.
  //
  // The exception is a returning visitor: the provider left in localStorage by
  // their last session says they will most likely land in the workspace, and
  // showing them the landing first would be a flash of the wrong page. A
  // first-time visitor — or a crawler — has no such hint and gets the landing
  // with no round trip in front of it.
  const isReturningVisitor = isBootstrapping && Boolean(provider);

  // Public lessons must stay readable for signed-in visitors, signed-out
  // visitors and returning visitors while the session request is still pending.
  if (isPublicContentPath(pathname)) {
    return <Suspense fallback={<ToolLoading />}><PublicPages /></Suspense>;
  }

  if (pathname === '/' && !hasApiKey && !isReturningVisitor) {
    return <LandingPage onKeySubmit={handleKeySubmission} />;
  }

  if (isBootstrapping) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-100 text-gray-500">
        <span className="h-7 w-7 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        <p className="text-sm">Starting Nevatal...</p>
      </div>
    );
  }

  // Every tool lives behind an API key; without one there is nothing to show
  // on those URLs but the landing page.
  if (!hasApiKey) {
    return <Navigate to="/" state={{ returnTo: pathname }} replace />;
  }

  // A course exercise can lead through the key form. Only allow known local
  // tools as the destination, and never send a generation automatically.
  const returnTo = ALL_TOOLS.find((tool) => tool.path === state?.returnTo)?.path ?? DEFAULT_TOOL_PATH;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <NavBar
        provider={provider}
        onClearApiKey={handleClearKey}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      <SpendAlert />

      <div className="flex flex-grow overflow-hidden">
        <Sidebar
          history={history}
          isHistoryLoading={isHistoryLoading}
          historyError={historyError}
          onRefreshHistory={refreshHistory}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="min-w-0 flex-grow overflow-hidden p-3 sm:p-6">
          <Suspense fallback={<ToolLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to={returnTo} replace />} />
            <Route path="/prompt" element={<PromptPage />} />
            <Route path="/explainer" element={<ExplainerPage />} />
            <Route path="/writer" element={<WriterPage />} />
            <Route path="/rewriter" element={<RewriterPage />} />
            <Route path="/proofreader" element={<ProofreaderPage />} />
            <Route path="/summarizer" element={<SummarizerPage />} />
            <Route path="/copywriting" element={<CopyWritingPage />} />
            <Route path="/email-builder" element={<EmailBuilderPage />} />
            <Route path="/social-caption" element={<PostGeneratorPage />} />
            <Route path="/ideas" element={<IdeaGeneratorPage />} />
            <Route path="/data-analysis" element={<DataAnalysisPage />} />
            <Route path="/data-formatter" element={<DataFormatterPage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/usage" element={<UsagePage />} />
            <Route path="/history/:id" element={<HistoryPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/translator" element={<TranslatorPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/document-ai" element={<DocumentAIPage />} />
            <Route path="/image-generation" element={<ImaGenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
