import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { findToolByPath } from '../tools';

interface NavBarProps {
  provider: string;
  onClearApiKey: () => Promise<void> | void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

const NavBar: React.FC<NavBarProps> = ({ provider, onClearApiKey }) => {
  const { pathname } = useLocation();
  const activeTool = findToolByPath(pathname);
  const isAboutPage = pathname === '/about';

  const handleClearApiKey = async () => {
    const confirmed = window.confirm(
      'Remove your API key from this browser? You will need to enter it again to keep using Nevatal.'
    );
    if (!confirmed) return;
    await onClearApiKey();
  };

  return (
    <nav className="flex-shrink-0 w-full h-16 bg-gray-900 text-white flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <img src="/logo.png" alt="" className="h-8 w-8" />
        <Link to="/" className="text-lg font-bold hover:text-blue-300">
          Nevatal
        </Link>
        {activeTool && (
          <span className="text-gray-500" aria-hidden="true">
            /
          </span>
        )}
        <span className="font-medium text-blue-300 truncate">
          {activeTool?.name ?? (isAboutPage ? 'About' : '')}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {provider && (
          <span
            className="hidden sm:inline text-xs bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-gray-300"
            title="The provider this session's API key belongs to"
          >
            {PROVIDER_LABELS[provider] ?? provider}
          </span>
        )}

        <Link
          to="/about"
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
        >
          About
        </Link>

        <button
          type="button"
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm"
          onClick={handleClearApiKey}
        >
          Clear API key
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
