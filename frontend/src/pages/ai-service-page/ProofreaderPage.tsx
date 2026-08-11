import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import {
  CheckboxField,
  SelectField,
  SubmitButton,
  type Option,
} from '../../components/FormControls';

const MODES: Option[] = [
  { value: 'spelling, grammar, and punctuation only, leaving the wording untouched', label: 'Spelling & grammar only' },
  { value: 'spelling, grammar, punctuation, and awkward phrasing that hurts clarity', label: 'Grammar + clarity' },
  { value: 'spelling, grammar, punctuation, clarity, and overall style and flow', label: 'Grammar, clarity & style' },
];

const VARIANTS: Option[] = [
  { value: '', label: 'No preference' },
  { value: 'British English', label: 'British English' },
  { value: 'American English', label: 'American English' },
];

const ProofreaderPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState(MODES[1].value);
  const [variant, setVariant] = useState(VARIANTS[0].value);
  const [listChanges, setListChanges] = useState(true);

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    reset();
  };

  const handleProofread = () => {
    if (!inputText.trim() || isLoading) return;

    const instructions = [`Proofread the text below, correcting ${mode}.`];

    if (variant) {
      instructions.push(`Use ${variant} spelling and conventions.`);
    }

    instructions.push(
      'Preserve the author\'s voice and meaning — do not rewrite it into something new.'
    );

    if (listChanges) {
      instructions.push(
        'Respond with the corrected text under a "## Corrected text" heading, then a "## Changes" heading with a bullet per correction explaining what changed and why.'
      );
    } else {
      instructions.push('Respond with the corrected text only, with no commentary.');
    }

    instructions.push('', 'Text to proofread:', inputText.trim());

    run(() => services.postProofreader(instructions.join('\n')));
  };

  const controls = (
    <>
      <SelectField
        id="proofread-mode"
        label="What to correct"
        value={mode}
        options={MODES}
        onChange={setMode}
        disabled={isLoading}
      />
      <SelectField
        id="proofread-variant"
        label="English variant"
        value={variant}
        options={VARIANTS}
        onChange={setVariant}
        disabled={isLoading}
      />
      <CheckboxField
        id="proofread-list-changes"
        label="List the changes made"
        checked={listChanges}
        onChange={setListChanges}
        disabled={isLoading}
      />
    </>
  );

  return (
    <PageLayout
      title="Proofreader"
      description="Catch errors without losing your voice. Choose how deep the pass should go and get the corrected text back — optionally with every change explained."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleProofread}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Proofreading..."
        >
          Proofread
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Your text"
            value={inputText}
            onChange={setInputText}
            placeholder="Paste the text you want proofread..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Corrected"
            loadingLabel="Checking your text..."
            downloadName="proofread"
            placeholderText="The corrected text will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default ProofreaderPage;
