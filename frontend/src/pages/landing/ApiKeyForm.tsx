import React, { useState } from 'react';
import services, { toApiError } from '../../services/services';
import { PROVIDER_STORAGE_KEY } from '../../constant';

interface ApiKeyFormProps {
  onKeySubmit: (provider: string) => void;
}

interface Provider {
  value: string;
  label: string;
  badge: string;
  endpoint: string;
  placeholder: string;
  tutorialUrl: string;
  tutorialSteps: string[];
  keyPattern: RegExp;
  invalidKeyMessage: string;
}

// OpenRouter first, because it is the default: one key reaches every model in
// its catalogue, and the workspace then offers a model picker.
const PROVIDERS: Provider[] = [
  {
    value: 'openrouter',
    label: 'OpenRouter',
    badge: '100+ Models · Universal',
    endpoint: '/openrouter/api-key-check/',
    placeholder: 'sk-or-v1-...',
    keyPattern: /^sk-or-v1-[A-Za-z0-9_-]{20,}$/,
    invalidKeyMessage: 'OpenRouter keys usually start with "sk-or-v1-" and are longer than 20 characters.',
    tutorialUrl: 'https://openrouter.ai/keys',
    tutorialSteps: [
      'Sign in or create an account.',
      'Navigate to the "Keys" section in your dashboard or settings.',
      'Click "Create Key", give it a name, and copy the generated key (it starts with "sk-or-v1-").',
      'Note: Ensure you have added credits to your OpenRouter account to use paid models.',
    ],
  },
  {
    value: 'openai',
    label: 'OpenAI',
    badge: 'GPT-4o & Reasoning',
    endpoint: '/openai/api-key-check/',
    placeholder: 'sk-...',
    keyPattern: /^sk-[A-Za-z0-9_-]{20,}$/,
    invalidKeyMessage: 'OpenAI keys usually start with "sk-" and are longer than 20 characters.',
    tutorialUrl: 'https://platform.openai.com/api-keys',
    tutorialSteps: [
      'Sign in or create an account.',
      'Navigate to the "API keys" section in your dashboard.',
      'Click "Create new secret key", optionally give it a name, and copy the key (it starts with "sk-").',
      'Note: You must add a payment method to your OpenAI account to use the API.',
    ],
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    badge: 'Document AI & Imagen',
    endpoint: '/gemini/api-key-check/',
    placeholder: 'AIza...',
    keyPattern: /^AIza[0-9A-Za-z_-]{20,}$/,
    invalidKeyMessage: 'Google Gemini keys usually start with "AIza" and are longer than 20 characters.',
    tutorialUrl: 'https://aistudio.google.com/app/apikey',
    tutorialSteps: [
      'Sign in with your Google account.',
      'Click on "Get API key" in the left navigation menu.',
      'Click "Create API key" and select a Google Cloud project (or create a new one).',
      'Copy the generated key (it starts with "AIza").',
    ],
  },
];

/** Provider SVGs for sleek visual tabs */
const ProviderIcon: React.FC<{ provider: string; className?: string }> = ({ provider, className = 'w-4 h-4' }) => {
  if (provider === 'openrouter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2a10 10 0 0 0-7.07 17.07l2.83-2.83a6 6 0 1 1 8.48 0l2.83 2.83A10 10 0 0 0 12 2Z" />
        <path d="M12 9v6" />
      </svg>
    );
  }
  if (provider === 'openai') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 10.3a5.5 5.5 0 0 0-.46-4.48 5.6 5.6 0 0 0-4.04-2.82 5.5 5.5 0 0 0-4.9 1.18 5.5 5.5 0 0 0-4.22.42 5.6 5.6 0 0 0-2.8 4.05 5.5 5.5 0 0 0-1.18 4.9 5.5 5.5 0 0 0 .42 4.22 5.6 5.6 0 0 0 4.05 2.8 5.5 5.5 0 0 0 4.9-1.18 5.5 5.5 0 0 0 4.22-.42 5.6 5.6 0 0 0 2.8-4.05 5.5 5.5 0 0 0 1.21-4.62ZM12 13.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5Z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
    </svg>
  );
};

/**
 * The sign-in surface of the app: pick a provider, hand over a key, get a
 * session cookie. It lives inside the landing page rather than on a page of
 * its own so the first thing a visitor reads and the thing they have to do
 * are on the same screen.
 */
const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onKeySubmit }) => {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].value);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [formatWarning, setFormatWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentProvider = PROVIDERS.find(p => p.value === selectedProvider)!;

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError('API key cannot be empty.');
      return;
    }

    // Non-blocking format hint – warn but still attempt the request
    if (!currentProvider.keyPattern.test(trimmedKey)) {
      setFormatWarning(currentProvider.invalidKeyMessage);
    } else {
      setFormatWarning('');
    }

    setLoading(true);
    setError('');

    try {
      // The key is encrypted with the backend's public key inside
      // validateApiKey, so it never travels in clear text.
      await services.validateApiKey(trimmedKey, currentProvider.endpoint);

      try {
        await services.checkApiKeySession();
      } catch {
        setError('The backend did not create an active API key session. Please check the API key and backend connection.');
        return;
      }

      localStorage.setItem(PROVIDER_STORAGE_KEY, selectedProvider);
      onKeySubmit(selectedProvider);
    } catch (error: unknown) {
      setError(toApiError(error).message || 'Invalid API key or network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Ambient background glow behind form */}
      <div 
        className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" 
        aria-hidden="true" 
      />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 ring-1 ring-gray-900/5 transition-all duration-300"
        aria-labelledby="api-key-form-heading"
      >
        <fieldset disabled={import.meta.env.SSR} className="min-w-0">
          {import.meta.env.SSR && (
            <p className="mb-4 text-sm text-gray-600">
              Enable JavaScript to connect an API key. You can read the courses without it.
            </p>
          )}

          {/* Security & status pill */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Client RSA-OAEP 2048-bit Encrypted
            </span>
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">Zero Logs</span>
          </div>

          <h2 id="api-key-form-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Start with your API key
          </h2>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            No signup, no subscription, zero middleman markup. Select your provider and paste your key to enter.
          </p>

          {/* Provider selector: Visually interactive tabs + accessible select */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="provider" className="block text-sm font-semibold text-gray-700">
                AI provider
              </label>
              <span className="text-xs text-blue-600 font-medium">
                {currentProvider.badge}
              </span>
            </div>

            {/* Accessible select control (supports tests and screen readers) */}
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setError('');
                setFormatWarning('');
              }}
              className="sr-only"
              aria-label="AI provider"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Modern Interactive Provider Tabs */}
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select AI Provider">
              {PROVIDERS.map((p) => {
                const isActive = selectedProvider === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => {
                      setSelectedProvider(p.value);
                      setError('');
                      setFormatWarning('');
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-2 ring-blue-500/20 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/60 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    <ProviderIcon provider={p.value} className={`w-4 h-4 mb-1.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="truncate w-full text-center">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API key input with show/hide toggle */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="api-key" className="block text-sm font-semibold text-gray-700">
                {currentProvider.label} API key
              </label>
              <span className="text-xs text-gray-400">
                Prefix: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{currentProvider.placeholder.slice(0, 6)}</code>
              </span>
            </div>

            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>

              <input
                id="api-key"
                name="api-key"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={currentProvider.placeholder}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setFormatWarning('');
                }}
              />

              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 focus:outline-none transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide API key' : 'Show API key'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0012 12.75a10.477 10.477 0 008.02-4.527M3.98 8.223C2.975 9.073 2.25 10.074 2.25 11.25c0 2.347 3.75 5.25 9.75 5.25s9.75-2.903 9.75-5.25c0-1.176-.725-2.177-1.73-3.027M3.98 8.223A10.5 10.5 0 0112 2.25c2.885 0 5.495 1.188 7.362 3.075M4.22 19.78l15-15" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Format warning (non-blocking) */}
          {formatWarning && (
            <div className="flex items-start gap-2 text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs sm:text-sm mt-3 animate-fadeIn">
              <svg className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formatWarning}</span>
            </div>
          )}

          {/* Backend / general error */}
          {error && (
            <div role="alert" className="flex items-start gap-2 text-rose-800 bg-rose-50/90 border border-rose-200/80 rounded-xl p-3 text-xs sm:text-sm mt-3 animate-fadeIn">
              <svg className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            className="group/btn relative w-full mt-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
            disabled={loading}
          >
            {/* Shimmer light effect over button */}
            <span className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 transform -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
            
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>Open the workspace</span>
                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
            Encrypted in transit with the backend's public key, then held in an
            httpOnly cookie. Never written to browser storage.
          </p>

          {/* Tutorial accordion */}
          <details className="mt-5 rounded-xl border border-gray-200 bg-gray-50/80 group transition-all">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How do I get a {currentProvider.label} API key?
              </span>
              <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <ol className="list-decimal list-outside pl-5 space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                <li>
                  Go to{' '}
                  <a
                    href={currentProvider.tutorialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    {currentProvider.label} API keys
                  </a>{' '}
                  {currentProvider.tutorialSteps[0]}
                </li>
                {currentProvider.tutorialSteps.slice(1).map((step, index) => (
                  <li key={index + 1}>{step}</li>
                ))}
              </ol>
            </div>
          </details>
        </fieldset>
      </form>
    </div>
  );
};

export default ApiKeyForm;
