import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import {
  SelectField,
  SubmitButton,
  TextField,
  type Option,
} from '../../components/FormControls';
import type { OutputFormat } from '../../interface';

const TARGETS: Option[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'table', label: 'Markdown table' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL inserts' },
  { value: 'xml', label: 'XML' },
];

const MODES: Option[] = [
  { value: 'convert', label: 'Clean and convert' },
  { value: 'validate', label: 'Validate only' },
];

/** How the result should be shown and downloaded for each target. */
const RESULT_FORMATS: Record<string, OutputFormat> = {
  json: 'json',
  csv: 'csv',
  table: 'table',
  yaml: 'text',
  sql: 'text',
  xml: 'text',
};

/**
 * Paste messy data, get it back in the shape you need — or get told what is
 * wrong with it.
 *
 * Validating and converting are deliberately separate: a report about your
 * data and a rewritten copy of it are different things to want, and mixing
 * them produces an answer that is neither.
 */
const DataFormatterPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [target, setTarget] = useState(TARGETS[0].value);
  const [mode, setMode] = useState(MODES[0].value);
  const [instructions, setInstructions] = useState('');

  const { result, error, isLoading, run, reset } = useAiTask();

  const isValidating = mode === 'validate';

  const handleClear = () => {
    setInputText('');
    setInstructions('');
    reset();
  };

  const handleRun = () => {
    if (!inputText.trim() || isLoading) return;

    run(() =>
      services.formatData({
        prompt: inputText.trim(),
        target,
        mode: isValidating ? 'validate' : 'convert',
        instructions: instructions.trim(),
      })
    );
  };

  const controls = (
    <>
      <SelectField
        id="data-mode"
        label="What to do"
        value={mode}
        options={MODES}
        onChange={setMode}
        disabled={isLoading}
      />
      <SelectField
        id="data-target"
        label="Convert to"
        value={target}
        options={TARGETS}
        onChange={setTarget}
        disabled={isLoading || isValidating}
        hint={isValidating ? 'Not used when validating.' : undefined}
      />
      <div className="sm:col-span-2">
        <TextField
          id="data-instructions"
          label="Extra instructions (optional)"
          value={instructions}
          onChange={setInstructions}
          placeholder="e.g., dates as ISO 8601, drop the notes column, snake_case keys"
          disabled={isLoading}
        />
      </div>
    </>
  );

  return (
    <PageLayout
      title="Data Formatter"
      description="Paste messy data — JSON, CSV, a copied table, a log — and get it cleaned and converted, or checked over and told exactly what is wrong with it."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleRun}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel={isValidating ? 'Checking...' : 'Converting...'}
        >
          {isValidating ? 'Validate' : `Convert to ${target.toUpperCase()}`}
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Data in"
            value={inputText}
            onChange={setInputText}
            placeholder="Paste JSON, CSV, a table copied from a spreadsheet, a log excerpt..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title={isValidating ? 'What is wrong with it' : 'Data out'}
            loadingLabel={isValidating ? 'Checking the data...' : 'Converting...'}
            downloadName={isValidating ? 'validation' : 'data'}
            format={isValidating ? 'markdown' : RESULT_FORMATS[target] ?? 'text'}
            placeholderText={
              isValidating
                ? 'Problems found in your data will be listed here.'
                : 'Your converted data will appear here.'
            }
          />
        }
      />
    </PageLayout>
  );
};

export default DataFormatterPage;
