import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import {
  SelectField,
  SubmitButton,
  TextAreaField,
  type Option,
} from '../../components/FormControls';

const CHANNELS: Option[] = [
  { value: 'a landing page hero section', label: 'Landing page' },
  { value: 'a short paid ad', label: 'Paid ad' },
  { value: 'a marketing email', label: 'Marketing email' },
  { value: 'a social media post', label: 'Social post' },
  { value: 'a product page description', label: 'Product page' },
];

const TONES: Option[] = [
  { value: 'clear and confident', label: 'Clear & confident' },
  { value: 'warm and friendly', label: 'Warm & friendly' },
  { value: 'bold and punchy', label: 'Bold & punchy' },
  { value: 'premium and understated', label: 'Premium' },
  { value: 'technical and precise', label: 'Technical' },
];

const CopyWritingPage: React.FC = () => {
  const [product, setProduct] = useState('');
  const [goals, setGoals] = useState('');
  const [audience, setAudience] = useState('');
  const [usp, setUsp] = useState('');
  const [channel, setChannel] = useState(CHANNELS[0].value);
  const [tone, setTone] = useState(TONES[0].value);

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setProduct('');
    setGoals('');
    setAudience('');
    setUsp('');
    reset();
  };

  const handleGenerateCopy = () => {
    if (!product.trim() || isLoading) return;

    const brief = [
      `Write ${channel} copy in a ${tone} tone.`,
      '',
      `Product or service: ${product.trim()}`,
      `Goal: ${goals.trim() || 'drive interest and sign-ups'}`,
      `Target audience: ${audience.trim() || 'a general audience'}`,
      `Unique selling proposition: ${usp.trim() || 'not specified — infer from the product description'}`,
      '',
      'Give a headline, a subheadline, the body copy, and a call to action, each under its own markdown heading.',
      'Keep every claim supportable by the details above — do not invent statistics, awards, or customer numbers.',
    ].join('\n');

    run(() => services.postCopywriting(brief));
  };

  const briefPanel = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Campaign brief
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            id="copy-channel"
            label="Where will this run?"
            value={channel}
            options={CHANNELS}
            onChange={setChannel}
            disabled={isLoading}
          />
          <SelectField
            id="copy-tone"
            label="Tone"
            value={tone}
            options={TONES}
            onChange={setTone}
            disabled={isLoading}
          />
        </div>

        <TextAreaField
          id="copy-product"
          label="What is your product or service?"
          value={product}
          onChange={setProduct}
          placeholder="e.g., A mobile app that tracks household budgets automatically"
          disabled={isLoading}
          rows={3}
        />
        <TextAreaField
          id="copy-goals"
          label="What should this copy achieve?"
          value={goals}
          onChange={setGoals}
          placeholder="e.g., Increase free-trial sign-ups"
          disabled={isLoading}
          rows={2}
          hint="Optional."
        />
        <TextAreaField
          id="copy-audience"
          label="Who is the audience?"
          value={audience}
          onChange={setAudience}
          placeholder="e.g., People aged 25-35 who have never budgeted before"
          disabled={isLoading}
          rows={2}
          hint="Optional."
        />
        <TextAreaField
          id="copy-usp"
          label="What makes it different?"
          value={usp}
          onChange={setUsp}
          placeholder="e.g., Categorises spending automatically, no manual entry"
          disabled={isLoading}
          rows={2}
          hint="Optional."
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Copywriting"
      description="Generate marketing copy shaped for the channel it will run on — headline, subheadline, body, and call to action."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleGenerateCopy}
          disabled={!product.trim()}
          isLoading={isLoading}
          loadingLabel="Writing copy..."
        >
          Generate copy
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={briefPanel}
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Copy"
            loadingLabel="Writing your copy..."
            downloadName="copy"
            placeholderText="Describe your product and your copy will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default CopyWritingPage;
