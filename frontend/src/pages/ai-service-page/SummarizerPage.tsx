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
import { countWords } from '../../utils/text';

const LENGTHS: Option[] = [
  { value: 'a very brief summary of one or two sentences', label: 'Brief' },
  { value: 'a summary of roughly one paragraph', label: 'Standard' },
  { value: 'a detailed summary that keeps the supporting detail', label: 'Detailed' },
];

const FORMATS: Option[] = [
  { value: 'continuous prose', label: 'Paragraph' },
  { value: 'a bulleted list', label: 'Bullet points' },
  { value: 'a list of key takeaways, each on its own line', label: 'Key takeaways' },
  { value: 'a single TL;DR line followed by three supporting bullets', label: 'TL;DR + bullets' },
];

const SummarizerPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [length, setLength] = useState(LENGTHS[1].value);
  const [format, setFormat] = useState(FORMATS[0].value);
  const [focus, setFocus] = useState('');

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    setFocus('');
    reset();
  };

  const handleSummarize = () => {
    if (!inputText.trim() || isLoading) return;

    const instructions = [
      `Summarise the text below as ${length}.`,
      `Present the summary as ${format}.`,
    ];

    if (focus.trim()) {
      instructions.push(`Focus especially on: ${focus.trim()}.`);
    }

    instructions.push(
      'Stay faithful to the source: do not add facts that are not in the text.',
      '',
      'Text to summarise:',
      inputText.trim()
    );

    run(() => services.postSummarizer(instructions.join('\n')));
  };

  const controls = (
    <>
      <SelectField
        id="summary-length"
        label="Summary length"
        value={length}
        options={LENGTHS}
        onChange={setLength}
        disabled={isLoading}
      />
      <SelectField
        id="summary-format"
        label="Format"
        value={format}
        options={FORMATS}
        onChange={setFormat}
        disabled={isLoading}
      />
      <div className="sm:col-span-2">
        <TextField
          id="summary-focus"
          label="Focus on (optional)"
          value={focus}
          onChange={setFocus}
          placeholder="e.g., the financial risks, the action items"
          disabled={isLoading}
        />
      </div>
    </>
  );

  return (
    <PageLayout
      title="Summarizer"
      description="Condense long text into the shape you actually need — a paragraph, a bullet list, or a set of key takeaways."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleSummarize}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Summarizing..."
        >
          Summarize
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Source text"
            value={inputText}
            onChange={setInputText}
            placeholder="Paste the article, transcript, or report you want summarised..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Summary"
            loadingLabel="Reading and condensing..."
            downloadName="summary"
            placeholderText="Your summary will appear here."
          />
        }
      />

      {result && !isLoading && (
        <p className="text-xs text-gray-500 text-right">
          {countWords(inputText)} words in → {countWords(result)} words out
        </p>
      )}
    </PageLayout>
  );
};

export default SummarizerPage;
