import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import { SelectField, SubmitButton, type Option } from '../../components/FormControls';

const DEPTHS: Option[] = [
  { value: 'overall', label: 'Overall sentiment' },
  { value: 'aspects', label: 'Sentiment per topic' },
  { value: 'entries', label: 'One verdict per line/review' },
];

const SentimentPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [depth, setDepth] = useState(DEPTHS[0].value);

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    reset();
  };

  const handleAnalyze = () => {
    if (!inputText.trim() || isLoading) return;

    const shape: Record<string, string> = {
      overall:
        'Report the overall sentiment as **Positive**, **Negative**, **Neutral**, or **Mixed**, with a confidence between 0 and 1.',
      aspects:
        'Report the overall sentiment, then a markdown table with one row per topic discussed: Topic | Sentiment | Evidence.',
      entries:
        'Treat each line as a separate entry and return a markdown table: Entry | Sentiment | Confidence | Why.',
    };

    const instructions = [
      'Analyse the sentiment of the text below.',
      shape[depth],
      'Then list the words or phrases that drove the verdict, and note any sarcasm or negation you accounted for.',
      'Base the analysis only on the text given.',
      '',
      'Text to analyse:',
      inputText.trim(),
    ];

    run(() => services.analyzeSentiment(instructions.join('\n')));
  };

  const controls = (
    <SelectField
      id="sentiment-depth"
      label="Analysis type"
      value={depth}
      options={DEPTHS}
      onChange={setDepth}
      disabled={isLoading}
      hint="Use per-line mode for a batch of reviews or comments."
    />
  );

  return (
    <PageLayout
      title="Sentiment Analysis"
      description="Judge the tone of feedback, reviews, or messages — overall, broken down by topic, or one verdict per line."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleAnalyze}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Analyzing..."
        >
          Analyze sentiment
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Text to analyse"
            value={inputText}
            onChange={setInputText}
            placeholder={'Paste feedback, reviews, or messages...\nOne per line for batch analysis.'}
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Analysis"
            loadingLabel="Reading the tone..."
            downloadName="sentiment-analysis"
            placeholderText="The sentiment breakdown will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default SentimentPage;
