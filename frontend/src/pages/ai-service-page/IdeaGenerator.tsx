import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import {
  NumberField,
  OutputFormatField,
  SelectField,
  SubmitButton,
  TextField,
  type Option,
} from '../../components/FormControls';
import type { OutputFormat } from '../../interface';

const KINDS: Option[] = [
  { value: 'business', label: 'Business ideas' },
  { value: 'names', label: 'Names' },
  { value: 'features', label: 'Product features' },
  { value: 'content', label: 'Content topics' },
  { value: 'angles', label: 'Marketing angles' },
  { value: 'solutions', label: 'Ways to solve it' },
];

/**
 * A brainstorm is a different job from every other tool here: many short,
 * genuinely different options rather than one polished answer.
 */
const IdeaGeneratorPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [kind, setKind] = useState(KINDS[0].value);
  const [count, setCount] = useState(10);
  const [constraints, setConstraints] = useState('');
  const [format, setFormat] = useState<OutputFormat>('markdown');

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    setConstraints('');
    reset();
  };

  const handleGenerate = () => {
    if (!inputText.trim() || isLoading) return;

    run(() =>
      services.generateIdeas({
        prompt: inputText.trim(),
        kind,
        count,
        constraints: constraints.trim(),
        outputFormat: format,
      })
    );
  };

  const controls = (
    <>
      <SelectField
        id="idea-kind"
        label="Brainstorm"
        value={kind}
        options={KINDS}
        onChange={setKind}
        disabled={isLoading}
      />
      <NumberField
        id="idea-count"
        label="How many"
        value={count}
        onChange={setCount}
        min={3}
        max={30}
        disabled={isLoading}
      />
      <div className="sm:col-span-2">
        <TextField
          id="idea-constraints"
          label="Constraints (optional)"
          value={constraints}
          onChange={setConstraints}
          placeholder="e.g., under £5k to start, one word only, no acronyms"
          disabled={isLoading}
        />
      </div>
      <OutputFormatField value={format} onChange={setFormat} disabled={isLoading} />
    </>
  );

  return (
    <PageLayout
      title="Idea Generator"
      description="Brainstorm on demand: business ideas, project and product names, content topics or angles — a numbered list of distinct options, each with a line on why it could work."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleGenerate}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Thinking..."
        >
          Generate {count} ideas
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="What are we brainstorming?"
            value={inputText}
            onChange={setInputText}
            placeholder="Describe the problem, product, audience or theme to generate ideas around..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Ideas"
            loadingLabel="Generating options..."
            downloadName="ideas"
            format={format}
            placeholderText="Your ideas will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default IdeaGeneratorPage;
