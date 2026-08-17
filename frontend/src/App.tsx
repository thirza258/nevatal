import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import services, { onHistoryChanged } from './services/services';
import { clearLegacyApiKey, getLegacyApiKey } from './services/auth';
import type { HistoryEntry } from './interface';
import { DEFAULT_TOOL_PATH, findToolByPath } from './tools';
import { DEFAULT_PAGE_TITLE, PROVIDER_STORAGE_KEY, SITE_NAME } from './constant';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import AboutPage from './pages/about/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/landing/LandingPage';

import PromptPage from './pages/ai-service-page/PromptPage';
import ProofreaderPage from './pages/ai-service-page/ProofreaderPage';
import RewriterPage from './pages/ai-service-page/RewriterPage';
import SummarizerPage from './pages/ai-service-page/SummarizerPage';
import TranslatorPage from './pages/ai-service-page/TranslatorPage';
import WriterPage from './pages/ai-service-page/WriterPage';
import CopyWritingPage from './pages/ai-service-page/CopyWritingPage';
import ExplainerPage from './pages/ai-service-page/ExplainerPage';
import SentimentPage from './pages/ai-service-page/SentimentPage';
import DocumentAIPage from './pages/ai-service-page/DocumentAIPage';
import ImaGenPage from './pages/ai-service-page/ImaGenPage';
import EmailBuilderPage from './pages/ai-service-page/EmailBuilderPage';

function App() {
  const { pathname } = useLocation();
  const [hasApiKey, setHasApiKey] = useState(false);
  // The session check is a round trip; without this the API key form flashes
  // on every reload before we know the user is already signed in.
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [provider, setProvider] = useState(
    () => localStorage.getItem(PROVIDER_STORAGE_KEY) || ''
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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
    setIsHistoryLoading(true);
    try {
      setHistory(await services.getHistory());
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasApiKey) return;
    void refreshHistory();
    // Each completed generation writes a row server-side; refetch so the
    // sidebar reflects what the user just did.
    return onHistoryChanged(() => {
      void refreshHistory();
    });
  }, [hasApiKey, refreshHistory]);

  // The document title is the one piece of metadata that changes per route.
  // Everything else a crawler reads is static in index.html, because every
  // signed-out URL resolves to the landing page.
  useEffect(() => {
    const tool = findToolByPath(pathname);
    if (tool) {
      document.title = `${tool.name} — ${SITE_NAME}`;
    } else if (pathname === '/about') {
      document.title = `About — ${SITE_NAME}`;
    } else {
      document.title = DEFAULT_PAGE_TITLE;
    }
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
      localStorage.removeItem(PROVIDER_STORAGE_KEY);
      setProvider('');
      setHistory([]);
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
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <NavBar provider={provider} onClearApiKey={handleClearKey} />

      <div className="flex flex-grow overflow-hidden">
        <Sidebar
          history={history}
          isHistoryLoading={isHistoryLoading}
          onRefreshHistory={refreshHistory}
        />

        <main className="flex-grow overflow-hidden p-6">
          <Routes>
            <Route path="/" element={<Navigate to={DEFAULT_TOOL_PATH} replace />} />
            <Route path="/prompt" element={<PromptPage />} />
            <Route path="/explainer" element={<ExplainerPage />} />
            <Route path="/writer" element={<WriterPage />} />
            <Route path="/rewriter" element={<RewriterPage />} />
            <Route path="/proofreader" element={<ProofreaderPage />} />
            <Route path="/summarizer" element={<SummarizerPage />} />
            <Route path="/copywriting" element={<CopyWritingPage />} />
            <Route path="/email-builder" element={<EmailBuilderPage />} />
            <Route path="/translator" element={<TranslatorPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/document-ai" element={<DocumentAIPage />} />
            <Route path="/image-generation" element={<ImaGenPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
