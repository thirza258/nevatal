import React, { useMemo, useRef, useState } from 'react';
import services, { toApiError } from '../../services/services';
import PageLayout from '../../components/PageLayout';
import {
  NumberField,
  OutputFormatField,
  SelectField,
  SubmitButton,
  TextField,
  type Option,
} from '../../components/FormControls';
import type { OutputFormat } from '../../interface';

/**
 * A batch run is the ordinary endpoints, one request per item. Nothing new
 * happens server-side, so the work costs exactly what doing it by hand would,
 * on the user's own key.
 */
interface BatchTool {
  value: string;
  label: string;
  path: string;
  needsLanguage?: boolean;
  needsTarget?: boolean;
}

const TOOLS: BatchTool[] = [
  { value: 'translate', label: 'Translate', path: '/translator/', needsLanguage: true },
  { value: 'summarize', label: 'Summarize', path: '/summarizer/' },
  { value: 'proofread', label: 'Proofread', path: '/proofreader/' },
  { value: 'rewrite', label: 'Rewrite', path: '/rewriter/' },
  { value: 'sentiment', label: 'Sentiment analysis', path: '/sentiment-analyzer/' },
  { value: 'copywriting', label: 'Copywriting', path: '/copywriting/' },
  { value: 'format', label: 'Clean and convert data', path: '/data-formatter/', needsTarget: true },
];

const SPLIT_MODES: Option[] = [
  { value: 'lines', label: 'One item per line' },
  { value: 'blank', label: 'Blank line between items' },
];

const TARGETS: Option[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'table', label: 'Markdown table' },
  { value: 'yaml', label: 'YAML' },
];

/** Enough for a real job, few enough that a mistake is not expensive. */
const ITEM_LIMIT = 200;

type ItemStatus = 'queued' | 'running' | 'done' | 'failed';

interface BatchItem {
  id: string;
  label: string;
  input: string;
  status: ItemStatus;
  output?: string;
  error?: string;
}

const STATUS_STYLES: Record<ItemStatus, string> = {
  queued: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const csvCell = (value: string) => `"${(value || '').replace(/"/g, '""')}"`;

const download = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const BatchPage: React.FC = () => {
  const [tool, setTool] = useState(TOOLS[0].value);
  const [rawText, setRawText] = useState('');
  const [splitMode, setSplitMode] = useState(SPLIT_MODES[0].value);
  const [targetLanguage, setTargetLanguage] = useState('Indonesian');
  const [target, setTarget] = useState(TARGETS[0].value);
  const [format, setFormat] = useState<OutputFormat>('markdown');
  const [concurrency, setConcurrency] = useState(3);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentTool = TOOLS.find((entry) => entry.value === tool) ?? TOOLS[0];

  const progress = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').length;
    const failed = items.filter((item) => item.status === 'failed').length;
    return { done, failed, total: items.length };
  }, [items]);

  const buildItems = (): BatchItem[] => {
    const pieces =
      splitMode === 'blank'
        ? rawText.split(/\n\s*\n/)
        : rawText.split('\n');

    return pieces
      .map((piece) => piece.trim())
      .filter(Boolean)
      .slice(0, ITEM_LIMIT)
      .map((input, index) => ({
        id: `i${index}`,
        label: `Item ${index + 1}`,
        input,
        status: 'queued' as ItemStatus,
      }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const loaded: BatchItem[] = [];
    for (const file of Array.from(files).slice(0, ITEM_LIMIT)) {
      try {
        loaded.push({
          id: `f${loaded.length}-${file.name}`,
          label: file.name,
          input: (await file.text()).trim(),
          status: 'queued',
        });
      } catch {
        // A file we cannot read is skipped rather than failing the whole load.
      }
    }

    setItems(loaded.filter((item) => item.input));
    setError('');
  };

  const buildBody = (input: string): Record<string, unknown> => {
    if (currentTool.needsLanguage) {
      return {
        prompt: input,
        target_language: targetLanguage,
        source_language: 'the language of the text',
      };
    }
    if (currentTool.needsTarget) {
      return { prompt: input, target, mode: 'convert', output_format: target };
    }
    return { prompt: input, output_format: format };
  };

  const patchItem = (id: string, patch: Partial<BatchItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  const runQueue = async (queue: BatchItem[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    setError('');

    let cursor = 0;
    const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (cursor < queue.length && !controller.signal.aborted) {
        const item = queue[cursor];
        cursor += 1;

        patchItem(item.id, { status: 'running', error: undefined });
        try {
          const output = await services.runBatchItem(
            currentTool.path,
            buildBody(item.input),
            controller.signal
          );
          patchItem(item.id, { status: 'done', output });
        } catch (failure) {
          if (controller.signal.aborted) {
            patchItem(item.id, { status: 'queued' });
            return;
          }
          patchItem(item.id, {
            status: 'failed',
            error: toApiError(failure).message,
          });
        }
      }
    });

    await Promise.all(workers);
    abortRef.current = null;
    setIsRunning(false);
  };

  const handleRun = () => {
    const prepared = items.length > 0 ? items : buildItems();
    if (prepared.length === 0) {
      setError('Add some items first — paste them in, or load a few files.');
      return;
    }

    setItems(prepared.map((item) => ({ ...item, status: 'queued', output: undefined })));
    void runQueue(prepared.map((item) => ({ ...item, status: 'queued' })));
  };

  const handleRetryFailed = () => {
    const failed = items.filter((item) => item.status === 'failed');
    if (failed.length === 0) return;
    void runQueue(failed);
  };

  const handleStop = () => abortRef.current?.abort();

  const handleClear = () => {
    abortRef.current?.abort();
    setItems([]);
    setRawText('');
    setError('');
  };

  const exportCsv = () =>
    download(
      ['item,input,status,output', ...items.map((item) =>
        [item.label, item.input, item.status, item.output ?? item.error ?? '']
          .map(csvCell)
          .join(',')
      )].join('\n'),
      'nevatal-batch.csv',
      'text/csv;charset=utf-8'
    );

  const exportJson = () =>
    download(
      JSON.stringify(
        items.map(({ label, input, status, output, error: itemError }) => ({
          label,
          input,
          status,
          output,
          error: itemError,
        })),
        null,
        2
      ),
      'nevatal-batch.json',
      'application/json;charset=utf-8'
    );

  return (
    <PageLayout
      title="Batch Runner"
      description="Run one tool over many inputs — a hundred lines, or a hundred files — with the results in a table you can export. Each item is a normal request on your own key, so a batch costs what doing it one at a time would."
      onClear={handleClear}
      error={error}
      actions={
        <>
          {items.some((item) => item.status === 'failed') && !isRunning && (
            <button
              type="button"
              onClick={handleRetryFailed}
              className="px-4 py-2.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            >
              Retry {progress.failed} failed
            </button>
          )}
          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              className="min-w-[12rem] bg-red-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-red-700"
            >
              Stop
            </button>
          ) : (
            <SubmitButton onClick={handleRun} isLoading={false}>
              Run batch
            </SubmitButton>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
          <SelectField
            id="batch-tool"
            label="Tool"
            value={tool}
            options={TOOLS.map(({ value, label }) => ({ value, label }))}
            onChange={setTool}
            disabled={isRunning}
          />

          {currentTool.needsLanguage && (
            <TextField
              id="batch-language"
              label="Translate into"
              value={targetLanguage}
              onChange={setTargetLanguage}
              disabled={isRunning}
            />
          )}

          {currentTool.needsTarget && (
            <SelectField
              id="batch-target"
              label="Convert to"
              value={target}
              options={TARGETS}
              onChange={setTarget}
              disabled={isRunning}
            />
          )}

          {!currentTool.needsLanguage && !currentTool.needsTarget && (
            <OutputFormatField value={format} onChange={setFormat} disabled={isRunning} />
          )}

          <SelectField
            id="batch-split"
            label="Split the text by"
            value={splitMode}
            options={SPLIT_MODES}
            onChange={setSplitMode}
            disabled={isRunning}
          />

          <NumberField
            id="batch-concurrency"
            label="At a time"
            value={concurrency}
            onChange={setConcurrency}
            min={1}
            max={5}
            hint="Higher is faster, and likelier to hit your provider's rate limit."
            disabled={isRunning}
          />

          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isRunning}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-300 disabled:opacity-50"
            >
              Load files as items
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,text/plain"
              className="sr-only"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              One file is one item. Up to {ITEM_LIMIT}.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[24rem]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {items.length > 0 ? `${progress.total} items` : 'Items'}
            </h2>
            <div className="flex items-center gap-2">
              {progress.total > 0 && (
                <span className="text-xs text-gray-500">
                  {progress.done} done
                  {progress.failed > 0 && `, ${progress.failed} failed`}
                </span>
              )}
              <button
                type="button"
                onClick={exportCsv}
                disabled={progress.done === 0}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={exportJson}
                disabled={progress.done === 0}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
              >
                Export JSON
              </button>
            </div>
          </div>

          {progress.total > 0 && (
            <div className="h-1 bg-gray-100">
              <div
                className="h-1 bg-blue-600 transition-all"
                style={{
                  width: `${Math.round(((progress.done + progress.failed) / progress.total) * 100)}%`,
                }}
              />
            </div>
          )}

          {items.length === 0 ? (
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={
                splitMode === 'blank'
                  ? 'Paste your items here, separated by a blank line...'
                  : 'Paste your items here, one per line...'
              }
              className="flex-grow w-full p-4 text-sm bg-white text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            />
          ) : (
            <div className="flex-grow overflow-y-auto divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500 truncate">
                      {item.label}
                    </span>
                    <span
                      className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2 break-words">
                    {item.input.slice(0, 200)}
                  </p>
                  {item.output && (
                    <p className="mt-1.5 text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {item.output}
                    </p>
                  )}
                  {item.error && (
                    <p className="mt-1.5 text-sm text-red-600">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
              Batch runs stay out of the history sidebar, but they do count
              towards what your key has spent.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BatchPage;
