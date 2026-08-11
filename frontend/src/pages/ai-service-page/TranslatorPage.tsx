import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import { SelectField, SubmitButton, type Option } from '../../components/FormControls';

const AUTO_DETECT = 'auto';

const LANGUAGES: Option[] = [
  { value: 'English', label: 'English' },
  { value: 'Indonesian', label: 'Indonesian' },
  { value: 'Malay', label: 'Malay' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Thai', label: 'Thai' },
];

const SOURCE_LANGUAGES: Option[] = [
  { value: AUTO_DETECT, label: 'Detect automatically' },
  ...LANGUAGES,
];

const REGISTERS: Option[] = [
  { value: '', label: 'Match the source' },
  { value: 'formal', label: 'Formal' },
  { value: 'informal', label: 'Informal' },
  { value: 'business/professional', label: 'Business' },
];

const TranslatorPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState(AUTO_DETECT);
  const [targetLang, setTargetLang] = useState('Indonesian');
  const [register, setRegister] = useState('');

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    reset();
  };

  /** Swap the two languages, and the text with them when we have a result. */
  const handleSwap = () => {
    if (sourceLang === AUTO_DETECT || isLoading) return;
    const previousSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(previousSource);
    if (result) {
      setInputText(result);
      reset();
    }
  };

  const handleTranslate = () => {
    if (!inputText.trim() || isLoading) return;

    const source =
      sourceLang === AUTO_DETECT ? 'the detected source language' : sourceLang;

    // The backend builds the translate instruction from the language names, so
    // anything extra has to be fenced off from the text itself.
    const payload = register
      ? [
          `Use a ${register} register in the translation.`,
          'Translate only the text between the markers and return the translation on its own.',
          '<<<TEXT',
          inputText.trim(),
          'TEXT>>>',
        ].join('\n')
      : inputText.trim();

    run(() => services.postTranslator(payload, targetLang, source));
  };

  const controls = (
    <>
      <SelectField
        id="translate-source"
        label="From"
        value={sourceLang}
        options={SOURCE_LANGUAGES}
        onChange={setSourceLang}
        disabled={isLoading}
      />
      <SelectField
        id="translate-target"
        label="To"
        value={targetLang}
        options={LANGUAGES}
        onChange={setTargetLang}
        disabled={isLoading}
      />
      <SelectField
        id="translate-register"
        label="Register"
        value={register}
        options={REGISTERS}
        onChange={setRegister}
        disabled={isLoading}
      />
      <button
        type="button"
        onClick={handleSwap}
        disabled={isLoading || sourceLang === AUTO_DETECT}
        className="self-end mb-0.5 px-3 py-2 text-sm bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          sourceLang === AUTO_DETECT
            ? 'Pick a specific source language to swap'
            : 'Swap languages'
        }
      >
        ⇄ Swap languages
      </button>
    </>
  );

  return (
    <PageLayout
      title="Translator"
      description="Translate between languages with the source detected for you, and control how formal the result should sound."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleTranslate}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Translating..."
        >
          Translate
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="Source text"
            value={inputText}
            onChange={setInputText}
            placeholder="Type or paste the text to translate..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title={`Translation — ${targetLang}`}
            loadingLabel="Translating..."
            downloadName="translation"
            placeholderText="The translation will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default TranslatorPage;
