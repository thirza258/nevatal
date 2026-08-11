import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ResultDisplayProps {
  resultText: string;
  isLoading: boolean;
  placeholderText?: string;
  title?: string;
  /** Base name for the .md download; omit to hide the download button. */
  downloadName?: string;
  loadingLabel?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  resultText,
  isLoading,
  placeholderText = 'Your result will appear here...',
  title = 'Result',
  downloadName,
  loadingLabel = 'Generating...',
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
    } catch {
      // Clipboard access can be denied (insecure origin, permissions).
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([resultText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${downloadName || 'result'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasResult = Boolean(resultText) && !isLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[20rem]">
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {downloadName && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
              disabled={!hasResult}
            >
              Download
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50 w-16"
            disabled={!hasResult}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-gray-500">
            <span className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
            <p className="text-sm">{loadingLabel}</p>
          </div>
        ) : resultText ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{resultText}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{placeholderText}</p>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
