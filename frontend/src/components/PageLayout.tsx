import React from 'react';

interface PageLayoutProps {
  title: string;
  description: string;
  onClear?: () => void;
  /** Error text shown above the content, e.g. a failed request. */
  error?: string;
  /** Submit row rendered under the content. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Standard frame for a tool page.
 *
 * <main> is `overflow-hidden` so the chat pages can own their own scrolling,
 * which means form pages have to scroll here instead. The old `h-screen` on
 * each page produced a second scrollbar and is gone.
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  onClear,
  error,
  actions,
  children,
}) => {
  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 pb-2">
      <header className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1 text-sm max-w-3xl">{description}</p>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {children}

      {actions && <div className="flex justify-end gap-3">{actions}</div>}
    </div>
  );
};

export default PageLayout;
