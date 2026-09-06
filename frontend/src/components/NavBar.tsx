import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { findToolByPath } from '../tools';
import ModelPicker from './ModelPicker';

interface NavBarProps {
  provider: string;
  onClearApiKey: () => Promise<void> | void;
  /** Opens the sidebar drawer, which is hidden by default on a phone. */
  onToggleSidebar?: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

const NavBar: React.FC<NavBarProps> = ({ provider, onClearApiKey, onToggleSidebar }) => {
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
    <nav className="flex-shrink-0 w-full h-16 bg-gray-900 text-white flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-gray-800 text-gray-300"
          aria-label="Open the tool menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <img src="/logo.png" alt="" className="h-8 w-8 hidden sm:block" />
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

        {/* Renders only when the session's provider publishes a catalogue. */}
        <ModelPicker provider={provider} />

        <Link
          to="/about"
          className="hidden sm:inline-block px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
        >
          About
        </Link>

        <button
          type="button"
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm whitespace-nowrap"
          onClick={handleClearApiKey}
        >
          <span className="hidden sm:inline">Clear API key</span>
          <span className="sm:hidden">Sign out</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
