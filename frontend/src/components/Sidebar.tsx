import React from 'react';
import { NavLink } from 'react-router-dom';
import type { HistoryEntry } from '../interface';
import { SESSION_PAGES, TOOL_GROUPS } from '../tools';
import { historyDateGroup, historyPreview, historyToolName } from '../services/history';

interface SidebarProps {
  history: HistoryEntry[];
  isHistoryLoading: boolean;
  onRefreshHistory: () => void;
  historyError?: string;
  /** Open on a phone, where the sidebar is a drawer rather than a column. */
  isOpen?: boolean;
  onClose?: () => void;
}

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `block px-2 py-1.5 rounded-md text-sm transition-colors ${
    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
  }`;

const formatCost = (cost?: number | null) => {
  if (cost == null) return '';
  if (cost === 0) return '$0';
  return cost < 0.01 ? `$${cost.toFixed(5)}` : `$${cost.toFixed(2)}`;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const Sidebar: React.FC<SidebarProps> = ({
  history,
  isHistoryLoading,
  onRefreshHistory,
  historyError,
  isOpen = false,
  onClose,
}) => {
  return (
    <>
      {/* On a phone the sidebar slides over the content instead of taking a
          third of the screen away from it. */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close the menu"
          onClick={onClose}
          className="md:hidden fixed inset-0 top-16 z-30 bg-gray-900/40"
        />
      )}
      <aside
        className={`w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col
          fixed md:static top-16 bottom-0 left-0 z-40 md:z-auto
          transition-transform md:transition-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
      <nav
        className="flex-shrink-0 max-h-[55%] overflow-y-auto p-4"
        onClick={() => onClose?.()}
      >
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
                  <NavLink to={tool.path} title={tool.description} className={linkClasses}>
                    {tool.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-1">Learn</p>
          <NavLink to="/courses" className={linkClasses}>Courses</NavLink>
        </div>

        <div className="mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-1">
            Session
          </p>
          <ul>
            {SESSION_PAGES.map((page) => (
              <li key={page.path}>
                <NavLink to={page.path} title={page.description} className={linkClasses}>
                  {page.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="flex-1 min-h-0 border-t border-gray-200 flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Chat history
          </h2>
          <div className="flex items-center gap-1">
          <NavLink to="/memory" onClick={onClose} aria-label="Manage memory and history"
            className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Memory</NavLink>
          <button
            type="button"
            onClick={onRefreshHistory}
            disabled={isHistoryLoading}
            className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {isHistoryLoading ? 'Loading' : 'Refresh'}
          </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {historyError && <p role="alert" className="mb-3 text-xs text-red-700">{historyError} Use Refresh to try again.</p>}
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">
              {isHistoryLoading
                ? 'Loading your history...'
                : 'Nothing yet — your generations will be listed here.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((entry, index) => (
                <li key={entry.id}>
                  {(index === 0 || historyDateGroup(history[index - 1].created_at) !== historyDateGroup(entry.created_at)) && (
                    <p className="pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{historyDateGroup(entry.created_at)}</p>
                  )}
                  <NavLink to={`/history/${entry.id}`} onClick={onClose}
                    aria-label={`Open saved ${historyToolName(entry.method)} chat: ${historyPreview(entry.prompt)}`}
                    className={({ isActive }) => `block rounded-md border p-3 transition-colors ${isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-700">
                      {historyToolName(entry.method)}
                    </span>
                    <time dateTime={entry.created_at} title={new Date(entry.created_at).toLocaleString()} className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatTimestamp(entry.created_at)}
                    </time>
                  </div>
                  <p className="text-xs font-medium text-gray-700 mt-1 line-clamp-2 break-words">
                    {historyPreview(entry.prompt) || 'Untitled chat'}
                  </p>
                  {entry.response && <p className="mt-1 line-clamp-2 break-words text-xs text-gray-500">{historyPreview(entry.response)}</p>}
                  {(entry.model || entry.cost != null) && (
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      {entry.model}
                      {entry.cost != null && ` · ${formatCost(entry.cost)}`}
                    </p>
                  )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
