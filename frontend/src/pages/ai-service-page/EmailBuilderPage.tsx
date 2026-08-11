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
  TextField,
  type Option,
} from '../../components/FormControls';

const TONES: Option[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm and friendly', label: 'Friendly' },
  { value: 'direct and brief', label: 'Direct' },
  { value: 'formal', label: 'Formal' },
  { value: 'apologetic and considerate', label: 'Apologetic' },
];

const LENGTHS: Option[] = [
  { value: 'no more than three short sentences', label: 'Very short' },
  { value: 'a short email of one or two paragraphs', label: 'Short' },
  { value: 'a full email with the detail spelled out', label: 'Detailed' },
];

const EmailBuilderPage: React.FC = () => {
  const [context, setContext] = useState('');
  const [recipients, setRecipients] = useState('');
  const [sender, setSender] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState(TONES[0].value);
  const [length, setLength] = useState(LENGTHS[1].value);

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setContext('');
    setRecipients('');
    setSender('');
    setPrompt('');
    reset();
  };

  // The backend rejects the request unless all four are present, so mirror
  // that here rather than letting the user submit into a 400.
  const missing = [
    !context.trim() && 'context',
    !recipients.trim() && 'recipients',
    !sender.trim() && 'sender',
    !prompt.trim() && 'instructions',
  ].filter(Boolean) as string[];

  const handleGenerateEmail = () => {
    if (missing.length > 0 || isLoading) return;

    const instructions = [
      prompt.trim(),
      '',
      `Tone: ${tone}.`,
      `Length: ${length}.`,
      'Start with a "Subject:" line, then the email body with a greeting and sign-off.',
    ].join('\n');

    run(() =>
      services.createEmail(context.trim(), recipients.trim(), sender.trim(), instructions)
    );
  };

  const formPanel = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Email details
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <TextAreaField
          id="email-context"
          label="What is the background?"
          value={context}
          onChange={setContext}
          placeholder="e.g., We met on Tuesday to review the Q3 campaign and agreed to move the launch date."
          disabled={isLoading}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="email-recipients"
            label="To"
            value={recipients}
            onChange={setRecipients}
            placeholder="e.g., the marketing team"
            disabled={isLoading}
          />
          <TextField
            id="email-sender"
            label="From"
            value={sender}
            onChange={setSender}
            placeholder="e.g., Jane Smith, Project Manager"
            disabled={isLoading}
          />
          <SelectField
            id="email-tone"
            label="Tone"
            value={tone}
            options={TONES}
            onChange={setTone}
            disabled={isLoading}
          />
          <SelectField
            id="email-length"
            label="Length"
            value={length}
            options={LENGTHS}
            onChange={setLength}
            disabled={isLoading}
          />
        </div>

        <TextAreaField
          id="email-prompt"
          label="What should the email say?"
          value={prompt}
          onChange={setPrompt}
          placeholder="e.g., Confirm the new launch date and ask each lead to send updated timelines by Friday."
          disabled={isLoading}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Email Builder"
      description="Draft an email from its context — who it is going to, who it is from, and what it needs to accomplish."
      onClear={handleClear}
      error={error}
      actions={
        <div className="flex items-center gap-3">
          {missing.length > 0 && (
            <span className="text-sm text-gray-500">
              Still needed: {missing.join(', ')}
            </span>
          )}
          <SubmitButton
            onClick={handleGenerateEmail}
            disabled={missing.length > 0}
            isLoading={isLoading}
            loadingLabel="Drafting..."
          >
            Generate email
          </SubmitButton>
        </div>
      }
    >
      <TwoColumnLayout
        inputComponent={formPanel}
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Draft email"
            loadingLabel="Drafting your email..."
            downloadName="email"
            placeholderText="Your generated email will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default EmailBuilderPage;
