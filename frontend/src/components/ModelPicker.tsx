import React, { useEffect, useMemo, useRef, useState } from 'react';
import services from '../services/services';
import type { AiModel } from '../interface';
import { MODEL_STORAGE_KEY } from '../constant';

interface ModelPickerProps {
  /** Provider of the session's key, so a new key refetches the catalogue. */
  provider: string;
}

const formatContext = (tokens: number | null): string => {
  if (!tokens) return '';
  if (tokens >= 1_000_000) return `${Math.round(tokens / 100_000) / 10}M context`;
  return `${Math.round(tokens / 1000)}K context`;
};

const formatPrice = (model: AiModel): string => {
  if (model.is_free) return 'free';

  const input = model.prompt_price_per_million;
  const output = model.completion_price_per_million;
  if (input == null || output == null) return 'price not published';

  return `$${input} in / $${output} out per M`;
};

/**
 * Choose which of the provider's models the tools run on.
 *
 * Only a provider that publishes a catalogue has anything to choose from —
 * OpenRouter, which routes to hundreds of models — so for an OpenAI or Gemini
 * key this renders nothing and every request stays on that provider's default.
 *
 * The choice is written to localStorage rather than passed down: the axios
 * client reads it on the way out, so no tool page needs to know a picker
 * exists.
 */
const ModelPicker: React.FC<ModelPickerProps> = ({ provider }) => {
  const [models, setModels] = useState<AiModel[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [selected, setSelected] = useState(
    () => localStorage.getItem(MODEL_STORAGE_KEY) || ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalogue = async () => {
      try {
        const catalogue = await services.listModels();
        if (!isMounted) return;

        setModels(catalogue.models);
        setDefaultModel(catalogue.default_model);

        // The backend resolved the provider from the key itself, so this is the
        // moment to drop a model this session cannot use: a key swapped in
        // another tab would otherwise leave a stale id on every request.
        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        if (stored && !catalogue.models.some((model) => model.id === stored)) {
          localStorage.removeItem(MODEL_STORAGE_KEY);
          setSelected('');
        }
      } catch (error) {
        // A catalogue we could not read says nothing about the stored choice,
        // so it is left alone and the picker simply does not appear.
        console.error('Failed to load the provider model list:', error);
      }
    };

    void loadCatalogue();

    return () => {
      isMounted = false;
    };
  }, [provider]);

  useEffect(() => {
    // The interceptor reads storage at request time, so a choice made in
    // another tab already applies here. Without this the chip would keep
    // naming the old model while requests ran on the new one — and the chip is
    // what someone reads to know what a generation is costing them.
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === MODEL_STORAGE_KEY) setSelected(event.newValue || '');
    };

    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    searchRef.current?.focus();

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) =>
      `${model.id} ${model.name}`.toLowerCase().includes(needle)
    );
  }, [models, query]);

  // Nothing to choose from: an OpenAI or Gemini key, or a catalogue that could
  // not be read. Either way there is no picker to show.
  if (models.length === 0) return null;

  const choose = (modelId: string) => {
    if (modelId) {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY);
    }
    setSelected(modelId);
    setIsOpen(false);
    setQuery('');
  };

  const activeModel = selected || defaultModel;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 max-w-[10rem] sm:max-w-[16rem] text-xs bg-gray-800 border border-gray-700 rounded-full pl-3 pr-2 py-1 text-gray-200 hover:border-gray-500"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={
          selected
            ? `Every tool runs on ${selected}`
            : `Every tool runs on this provider's default, ${defaultModel}`
        }
      >
        <span className="truncate">{activeModel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose a model"
          className="absolute right-0 top-full mt-2 z-20 w-[22rem] sm:w-[28rem] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-700 bg-gray-800 shadow-2xl"
        >
          <div className="p-3 border-b border-gray-700">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query.trim() && filtered.length > 0) {
                  event.preventDefault();
                  choose(filtered[0].id);
                }
              }}
              placeholder={`Search ${models.length} models`}
              className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search models"
            />
            <p className="mt-2 text-[11px] text-gray-400">
              {filtered.length === models.length
                ? `Every model this key can be pointed at (${models.length}).`
                : `${filtered.length} of ${models.length} models.`}{' '}
              The choice applies to every tool.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {!query.trim() && (
              <button
                type="button"
                onClick={() => choose('')}
                aria-pressed={!selected}
                className={`w-full text-left px-3 py-2 hover:bg-gray-700/60 ${selected ? '' : 'bg-gray-700'}`}
              >
                <span className="block text-sm text-white">Default</span>
                <span className="block text-[11px] text-gray-400 truncate">
                  {defaultModel}
                </span>
              </button>
            )}

            {filtered.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => choose(model.id)}
                aria-pressed={model.id === selected}
                className={`w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-gray-700/60 ${
                  model.id === selected ? 'bg-gray-700' : ''
                }`}
              >
                <span className="flex-grow min-w-0">
                  <span className="block text-sm text-white truncate">
                    {model.name}
                  </span>
                  <span className="block text-[11px] text-gray-400 truncate">
                    {model.id}
                  </span>
                </span>
                <span className="flex-shrink-0 text-right text-[11px] text-gray-400">
                  <span className="block">{formatContext(model.context_length)}</span>
                  <span className={`block ${model.is_free ? 'text-emerald-400' : ''}`}>
                    {formatPrice(model)}
                  </span>
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-gray-400">
                No model matches “{query.trim()}”.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPicker;
