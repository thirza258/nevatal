import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_TOOL_PATH } from '../tools';

// App's route metadata marks unknown pages noindex and restores it on navigation.
const NotFoundPage: React.FC<{ homePath?: string; homeLabel?: string }> = ({
  homePath = DEFAULT_TOOL_PATH,
  homeLabel = 'Back to Prompt',
}) => {
  return (
    <div className="h-full overflow-y-auto flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-10 text-center max-w-md">
        <p className="text-4xl font-bold text-gray-300">404</p>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Page not found</h1>
        <p className="text-gray-600 mt-2 text-sm">
          That address does not match a page. Follow the link below to get back
          to Nevatal.
        </p>
        <Link
          to={homePath}
          className="inline-block mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-blue-700"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
