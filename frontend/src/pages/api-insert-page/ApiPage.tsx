import React, { useState } from 'react';
import services, { toApiError } from '../../services/services';

interface ApiKeyInputPageProps {
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

const PROVIDERS: Provider[] = [
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
];

const ApiInputPage: React.FC<ApiKeyInputPageProps> = ({ onKeySubmit }) => {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].value);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [formatWarning, setFormatWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentProvider = PROVIDERS.find(p => p.value === selectedProvider)!;

  const handleSaveKey = async (): Promise<void> => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError('API key cannot be empty.');
      return;
    }

    // Non‑blocking format hint – warn but still attempt the request
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

      localStorage.setItem('activeProvider', selectedProvider);
      onKeySubmit(selectedProvider);
    } catch (error: unknown) {
      setError(toApiError(error).message || 'Invalid API key or network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveKey();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Enter Your API Key
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Choose a provider and enter your API key to continue.
        </p>

        {/* Provider selector */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">AI Provider</label>
          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(e.target.value);
              setError('');
              setFormatWarning('');
            }}
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Tutorial section (dynamic per provider) */}
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">
            How to get your {currentProvider.label} API Key:
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li className="text-gray-600">
              Go to{' '}
              <a
                href={currentProvider.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {currentProvider.label} API Keys
              </a>{' '}
              {currentProvider.tutorialSteps[0]}
            </li>
            {currentProvider.tutorialSteps.slice(1).map((step, index) => (
              <li key={index + 1} className="text-gray-600">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* API Key input with show/hide toggle */}
        <div className="mb-4 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full border rounded-md px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder={currentProvider.placeholder}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setFormatWarning('');
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide API key' : 'Show API key'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0012 12.75a10.477 10.477 0 008.02-4.527M3.98 8.223C2.975 9.073 2.25 10.074 2.25 11.25c0 2.347 3.75 5.25 9.75 5.25s9.75-2.903 9.75-5.25c0-1.176-.725-2.177-1.73-3.027M3.98 8.223A10.5 10.5 0 0112 2.25c2.885 0 5.495 1.188 7.362 3.075M4.22 19.78l15-15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Format warning (non‑blocking) */}
        {formatWarning && (
          <p className="text-yellow-600 text-sm text-center mb-2">{formatWarning}</p>
        )}

        {/* Backend / general error */}
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          className="w-full bg-blue-600 text-white py-2 rounded-md text-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          onClick={handleSaveKey}
          disabled={loading}
        >
          {loading ? 'Validating...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
};

export default ApiInputPage;