import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { PromptTemplate } from '../interface';
import {
  deleteTemplate,
  exportTemplates,
  importTemplates,
  saveTemplate,
  templatesForTool,
} from '../services/templates';

interface TemplateLibraryProps {
  /** The current input, offered for saving. */
  value: string;
  onApply: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * Save the prompt you are working on, and put a saved one back.
 *
 * The library lives in this browser, scoped to the tool it was saved from, so
 * the Writer's templates are not in the way of the Translator's. Export and
 * import are how a set of prompts moves between people — or between your own
 * machines — without this app needing accounts to keep them under.
 */
const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ value, onApply, disabled }) => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTemplates(templatesForTool(pathname));
  }, [isOpen, pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const handleSave = () => {
    if (!value.trim()) return;
    saveTemplate(name || value.trim().slice(0, 40), value, pathname);
    setTemplates(templatesForTool(pathname));
    setName('');
    setMessage('Saved to this browser.');
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      await importTemplates(file);
      setTemplates(templatesForTool(pathname));
      setMessage('Imported.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That file could not be read.');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setMessage('');
        }}
        disabled={disabled}
        className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        Templates
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Prompt templates"
          className="absolute right-0 top-full mt-2 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-xl"
        >
          <div className="p-3 border-b border-gray-200">
            <label htmlFor="template-name" className="block text-xs font-medium text-gray-600">
              Save this prompt as
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name it"
                className="flex-grow rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!value.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                Save
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {templates.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                Nothing saved for this tool yet.
              </p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="flex items-start gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(template.prompt);
                      setIsOpen(false);
                    }}
                    className="flex-grow min-w-0 text-left hover:text-blue-700"
                  >
                    <span className="block text-sm font-medium text-gray-800 truncate">
                      {template.name}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {template.prompt}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplates(deleteTemplate(template.id).filter(
                      (entry) => !entry.tool || entry.tool === pathname
                    ))}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 text-sm px-1"
                    aria-label={`Delete ${template.name}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={exportTemplates}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
            >
              Export all
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
            >
              Import a file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                void handleImport(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>

          {message && (
            <p className="px-3 pb-3 text-xs text-gray-500">{message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
