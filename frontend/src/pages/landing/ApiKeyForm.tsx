import React, { useState } from 'react';
import services, { toApiError } from '../../services/services';
import { PROVIDER_STORAGE_KEY } from '../../constant';

interface ApiKeyFormProps {
  onKeySubmit: (provider: string) => void;
}

interface Provider {
  value: string;
  label: string;
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
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl ring-1 ring-gray-900/5"
      aria-labelledby="api-key-form-heading"
    >
      <h2 id="api-key-form-heading" className="text-xl font-bold text-gray-900">
        Start with your API key
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        No sign-up, no account. Pick your provider and paste a key to open the
        workspace.
      </p>

      {/* Provider selector */}
      <div className="mt-6">
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
          AI provider
        </label>
        <select
          id="provider"
          value={selectedProvider}
          onChange={(e) => {
            setSelectedProvider(e.target.value);
            setError('');
            setFormatWarning('');
          }}
          className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* API key input with show/hide toggle */}
      <div className="mt-4">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
          {currentProvider.label} API key
        </label>
        <div className="relative">
          <input
            id="api-key"
            name="api-key"
            type={showPassword ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md px-4 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={currentProvider.placeholder}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setFormatWarning('');
            }}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
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
        <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-sm mt-3">
          {formatWarning}
        </p>
      )}

      {/* Backend / general error */}
      {error && (
        <p role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm mt-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full mt-5 bg-blue-600 text-white py-2.5 rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        disabled={loading}
      >
        {loading ? 'Validating...' : 'Open the workspace'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Encrypted in transit with the backend's public key, then held in an
        httpOnly cookie. Never written to browser storage.
      </p>

      {/* Tutorial, collapsed so it does not push the form off the screen */}
      <details className="mt-5 rounded-md border border-gray-200 bg-gray-50 group">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900">
          How do I get a {currentProvider.label} API key?
        </summary>
        <ol className="list-decimal list-outside px-4 pb-4 pl-9 space-y-2 text-sm text-gray-600">
          <li>
            Go to{' '}
            <a
              href={currentProvider.tutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {currentProvider.label} API keys
            </a>{' '}
            {currentProvider.tutorialSteps[0]}
          </li>
          {currentProvider.tutorialSteps.slice(1).map((step, index) => (
            <li key={index + 1}>{step}</li>
          ))}
        </ol>
      </details>
    </form>
  );
};

export default ApiKeyForm;
