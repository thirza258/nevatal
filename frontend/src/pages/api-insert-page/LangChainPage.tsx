import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../constant';

interface LangChainPageProps {
  onKeySubmit: () => void;
}

const LangChainPage: React.FC<LangChainPageProps> = ({ onKeySubmit }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSaveKey = () => {
    if (apiKey.trim() === '') {
      setError('API Key cannot be empty.');
      return;
    }

    axios.get(`${API_URL}/langchain/api-key-check/`, {
      headers: {
        Authorization: apiKey,
      },
      withCredentials: true,
    }).then((response) => {
    if (response.status === 200) {
      setError('');
      onKeySubmit();
    } else {
      setError('Invalid API Key');
    }
  }).catch((error) => {
    setError('Invalid API Key + ' + error);
  });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveKey();
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Enter Your API Key
        </h1>
        <p className="text-center text-gray-600 mb-6">
          An API key is required to use the application's features. Please enter your key below to continue.
        </p>
        
        {/* Tutorial Section */}
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">How to get your Google AI API Key:</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Go to{" "}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a> and sign in.
            </li>
            <li>
              Click on the <strong>"Get API key"</strong> button, usually found in the top left menu.
            </li>
            <li>
              Click <strong>"Create API key in new project"</strong>.
            </li>
            <li>
              Copy the generated API key and paste it into the input field below.
            </li>
          </ol>
        </div>

        <div className="mb-4">
          <input
            type="password"
            className="w-full border rounded-md px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-md text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          onClick={handleSaveKey}
        >
          Save and Continue
        </button>
      </div>
    </div>
  );

};

export default LangChainPage;
