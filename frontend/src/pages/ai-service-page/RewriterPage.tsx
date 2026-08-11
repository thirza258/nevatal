import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import { SelectField, SubmitButton, type Option } from '../../components/FormControls';

const GOALS: Option[] = [
  { value: 'keep the meaning but make it clearer and better written', label: 'Improve clarity' },
  { value: 'make it significantly shorter without losing the key information', label: 'Make it shorter' },
  { value: 'expand it with more detail and supporting explanation', label: 'Expand it' },
  { value: 'simplify the language so a non-expert can follow it', label: 'Simplify language' },
  { value: 'make it more persuasive', label: 'Make it persuasive' },
  { value: 'rephrase it so the wording is original while the meaning is unchanged', label: 'Rephrase / paraphrase' },
];

const TONES: Option[] = [
  { value: '', label: 'Keep original tone' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly and conversational', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'confident and direct', label: 'Confident' },
];

const RewriterPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [goal, setGoal] = useState(GOALS[0].value);
  const [tone, setTone] = useState(TONES[0].value);

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    reset();
  };

  const handleRewrite = () => {
    if (!inputText.trim() || isLoading) return;

    const instructions = [`Rewrite the text below: ${goal}.`];

    if (tone) {
      instructions.push(`Use a ${tone} tone.`);
    }

    instructions.push(
      'Return only the rewritten text, with no preamble and no explanation of the changes.',
      '',
      'Text to rewrite:',
      inputText.trim()
    );

    run(() => services.postRewriter(instructions.join('\n')));
  };

  const controls = (
    <>
      <SelectField
        id="rewrite-goal"
        label="Rewrite goal"
        value={goal}
        options={GOALS}
        onChange={setGoal}
        disabled={isLoading}
      />
      <SelectField
        id="rewrite-tone"
        label="Tone"
        value={tone}
        options={TONES}
        onChange={setTone}
        disabled={isLoading}
      />
    </>
  );

  return (
    <PageLayout
      title="Rewriter"
      description="Rework existing text towards a specific goal — shorter, clearer, simpler, or in a different tone — with the original kept alongside for comparison."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleRewrite}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Rewriting..."
        >
          Rewrite
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Original"
            value={inputText}
            onChange={setInputText}
            placeholder="Paste the text you want to rewrite..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Rewritten"
            loadingLabel="Rewriting your text..."
            downloadName="rewritten"
            placeholderText="The rewritten version will appear here, next to your original."
          />
        }
      />
    </PageLayout>
  );
};

export default RewriterPage;
