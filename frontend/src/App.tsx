import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import services, { onHistoryChanged } from './services/services';
import { clearLegacyApiKey, getLegacyApiKey } from './services/auth';
import type { HistoryEntry } from './interface';
import { DEFAULT_TOOL_PATH } from './tools';
import { ACTIVE_DOCUMENT_KEY, PROVIDER_STORAGE_KEY } from './constant';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import AboutPage from './pages/about/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import ApiKeyPage from './pages/api-insert-page/ApiPage';

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
      // Otherwise the next user of this browser inherits a document banner
      // for an index they cannot query.
      localStorage.removeItem(ACTIVE_DOCUMENT_KEY);
      setProvider('');
      setHistory([]);
      setHasApiKey(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-100 text-gray-500">
        <span className="h-7 w-7 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        <p className="text-sm">Starting Nevatal...</p>
      </div>
    );
  }

  if (!hasApiKey) {
    return <ApiKeyPage onKeySubmit={handleKeySubmission} />;
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
