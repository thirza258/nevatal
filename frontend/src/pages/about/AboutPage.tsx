import React from 'react';
import FeatureCard from '../../components/FeatureCard';
import { TOOL_GROUPS } from '../../tools';

const AboutPage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-8">
        <header className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-900">About Nevatal</h1>
          <p className="text-gray-600 mt-2">
            Nevatal puts a set of focused AI tools behind one interface. You
            bring your own API key, it stays in an httpOnly cookie on the
            server, and every request is made with that key.
          </p>
        </header>

        {TOOL_GROUPS.map((group) => (
          <section key={group.name}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {group.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {group.tools.map((tool) => (
                <FeatureCard
                  key={tool.path}
                  title={tool.name}
                  description={tool.description}
                  to={tool.path}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Which key do I need?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>
              <strong>Any provider</strong> — OpenAI, Google Gemini, or
              OpenRouter works for all the text tools.
            </li>
            <li>
              <strong>Google Gemini only</strong> — Document AI builds its search
              index with Google embeddings, and Image Generation uses Google's
              image model. Both fail with an OpenAI or OpenRouter key.
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Your key is never stored in the browser's local storage, and you can
            remove it at any time with "Clear API key" in the top bar.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
