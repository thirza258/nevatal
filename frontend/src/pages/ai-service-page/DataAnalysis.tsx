import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import services, { toApiError } from '../../services/services';
import PageLayout from '../../components/PageLayout';
import DataChart from '../../components/DataChart';
import { SubmitButton, TextField } from '../../components/FormControls';
import type { ColumnProfile, DataAnalysis } from '../../interface';

const number = (value?: number | null) =>
  value == null ? '—' : Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);

const ColumnRow: React.FC<{ column: ColumnProfile }> = ({ column }) => (
  <tr className="border-t border-gray-100">
    <td className="px-3 py-1.5 text-gray-900 font-medium truncate max-w-[12rem]">
      {column.name}
    </td>
    <td className="px-3 py-1.5 text-gray-500">{column.kind}</td>
    <td className="px-3 py-1.5 text-right text-gray-600">{column.unique.toLocaleString()}</td>
    <td className="px-3 py-1.5 text-right text-gray-600">{column.nulls.toLocaleString()}</td>
    <td className="px-3 py-1.5 text-gray-600 truncate max-w-[16rem]">
      {column.kind === 'number'
        ? `${number(column.min)} – ${number(column.max)} (mean ${number(column.mean)})`
        : (column.top ?? []).join(', ')}
    </td>
  </tr>
);

/**
 * Upload a CSV and get an analysis of it: what the columns are, what the data
 * shows, and charts of the parts worth looking at.
 *
 * The model reads a profile and a sample and decides what is worth plotting;
 * the numbers on every chart are computed server-side over the whole file, so
 * a chart is never a guess about data the model only partly saw.
 */
const DataAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState('');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const canRun = Boolean(file || pasted.trim());

  const handleClear = () => {
    setFile(null);
    setPasted('');
    setQuestion('');
    setAnalysis(null);
    setError('');
  };

  const handleRun = async () => {
    if (!canRun || isLoading) return;

    setIsLoading(true);
    setError('');
    try {
      setAnalysis(
        await services.analyseData({
          file: file ?? undefined,
          text: file ? undefined : pasted.trim(),
          question: question.trim(),
        })
      );
    } catch (failure) {
      setError(toApiError(failure).message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!analysis) return;

    const lines = [
      `# Data analysis`,
      '',
      `${analysis.profile.rows.toLocaleString()} rows, ${analysis.profile.column_count} columns.`,
      '',
      analysis.insights,
      '',
      ...analysis.charts.flatMap((chart) => [
        `## ${chart.title}`,
        '',
        `| ${chart.x_label} | ${chart.y_label} |`,
        '| --- | --- |',
        ...(chart.series[0]?.points ?? []).map(
          (point) => `| ${point.x} | ${point.y ?? ''} |`
        ),
        '',
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-analysis.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout
      title="Data Analysis"
      description="Upload a CSV and get it read back to you: what each column holds, what the data shows, and charts of the parts worth a look. The charts are computed from your whole file, not from a sample."
      onClear={handleClear}
      error={error}
      actions={
        <>
          {analysis && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
            >
              Download analysis
            </button>
          )}
          <SubmitButton
            onClick={() => void handleRun()}
            disabled={!canRun}
            isLoading={isLoading}
            loadingLabel="Analysing..."
          >
            Analyse
          </SubmitButton>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-300 disabled:opacity-50"
            >
              {file ? 'Choose a different CSV' : 'Choose a CSV file'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
            <p className="mt-1 text-xs text-gray-500 truncate">
              {file ? file.name : 'Or paste the rows below.'}
            </p>
          </div>

          {!file && (
            <textarea
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder={'region,units\nNorth,10\nSouth,4'}
              rows={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          )}

          <TextField
            id="analysis-question"
            label="Question (optional)"
            value={question}
            onChange={setQuestion}
            placeholder="e.g., which region is growing fastest?"
            disabled={isLoading}
          />

          <p className="text-xs text-gray-500">
            Only a profile of your data and the first few rows are sent to the
            model. The charts are computed from the whole file.
          </p>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {analysis ? (
            <>
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-2.5 border-b border-gray-200 flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    The data
                  </h2>
                  <span className="text-xs text-gray-500">
                    {analysis.profile.rows.toLocaleString()} rows ·{' '}
                    {analysis.profile.column_count} columns
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Column</th>
                        <th className="text-left px-3 py-2 font-medium">Kind</th>
                        <th className="text-right px-3 py-2 font-medium">Unique</th>
                        <th className="text-right px-3 py-2 font-medium">Missing</th>
                        <th className="text-left px-3 py-2 font-medium">Range or examples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.profile.columns.map((column) => (
                        <ColumnRow key={column.name} column={column} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {analysis.insights && (
                <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    What it shows
                  </h2>
                  <div className="prose prose-sm max-w-none mt-2">
                    <ReactMarkdown>{analysis.insights}</ReactMarkdown>
                  </div>
                </section>
              )}

              {analysis.charts.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {analysis.charts.map((chart, index) => (
                    <DataChart key={`${chart.title}-${index}`} chart={chart} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-grow min-h-[20rem] flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-400">
                  {isLoading ? 'Reading your data...' : 'No analysis yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isLoading
                    ? 'Profiling the columns, then working out what is worth plotting.'
                    : 'Choose a CSV or paste some rows, then press Analyse.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DataAnalysisPage;
