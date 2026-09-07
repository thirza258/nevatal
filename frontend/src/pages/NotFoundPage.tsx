import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_TOOL_PATH } from '../tools';

/**
 * Ask crawlers to leave this page out of the index.
 *
 * A single-page app cannot answer an unknown URL with a real 404: nginx serves
 * index.html for anything it does not recognise, so the status is 200 and a
 * crawler would file this as a thin page on a working URL — a soft 404. The
 * meta tag is the only signal available from in here, and it is removed again
 * on the way out so it cannot follow the user to a real page.
 */
const useNoIndex = () => {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, follow';
    document.head.appendChild(meta);

    return () => meta.remove();
  }, []);
};

const NotFoundPage: React.FC = () => {
  useNoIndex();

  return (
    <div className="h-full overflow-y-auto flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10 text-center max-w-md">
        <p className="text-4xl font-bold text-gray-300">404</p>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Page not found</h1>
        <p className="text-gray-600 mt-2 text-sm">
          That address does not match any tool. Pick one from the sidebar, or go
          back to the start.
        </p>
        <Link
          to={DEFAULT_TOOL_PATH}
          className="inline-block mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700"
        >
          Back to Prompt
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
