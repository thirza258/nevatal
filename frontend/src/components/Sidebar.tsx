import React from 'react';
import { NavLink } from 'react-router-dom';
import type { HistoryEntry } from '../interface';
import { TOOL_GROUPS } from '../tools';

interface SidebarProps {
  history: HistoryEntry[];
  isHistoryLoading: boolean;
  onRefreshHistory: () => void;
}

const prettifyMethod = (method: string) =>
  method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const minutesAgo = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  if (minutesAgo < 1440) return `${Math.round(minutesAgo / 60)}h ago`;
  return date.toLocaleDateString();
};

const Sidebar: React.FC<SidebarProps> = ({
  history,
  isHistoryLoading,
  onRefreshHistory,
}) => {
  return (
    <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-shrink-0 max-h-[55%] overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Tools
        </h2>

        {TOOL_GROUPS.map((group) => (
          <div key={group.name} className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-1">
              {group.name}
            </p>
            <ul>
              {group.tools.map((tool) => (
                <li key={tool.path}>
                  <NavLink
                    to={tool.path}
                    title={tool.description}
                    className={({ isActive }) =>
                      `block px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    {tool.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex-1 min-h-0 border-t border-gray-200 flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent activity
          </h2>
          <button
            type="button"
            onClick={onRefreshHistory}
            disabled={isHistoryLoading}
            className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {isHistoryLoading ? 'Loading' : 'Refresh'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">
              {isHistoryLoading
                ? 'Loading your history...'
                : 'Nothing yet — your generations will be listed here.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((entry, index) => (
                <li
                  key={`${entry.created_at}-${index}`}
                  className="rounded-md border border-gray-200 p-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-700">
                      {prettifyMethod(entry.method)}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatTimestamp(entry.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 break-words">
                    {entry.prompt}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
