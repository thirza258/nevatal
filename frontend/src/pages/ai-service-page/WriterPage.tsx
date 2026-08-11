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

const CONTENT_TYPES: Option[] = [
  { value: 'article', label: 'Article' },
  { value: 'blog post', label: 'Blog post' },
  { value: 'essay', label: 'Essay' },
  { value: 'short story', label: 'Short story' },
  { value: 'product description', label: 'Product description' },
  { value: 'social media post', label: 'Social media post' },
  { value: 'speech', label: 'Speech' },
  { value: 'report', label: 'Report' },
];

const TONES: Option[] = [
  { value: 'neutral and informative', label: 'Neutral' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly and conversational', label: 'Friendly' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'playful', label: 'Playful' },
];

const LENGTHS: Option[] = [
  { value: 'short', label: 'Short (~200 words)' },
  { value: 'medium', label: 'Medium (~500 words)' },
  { value: 'long', label: 'Long (~900 words)' },
];

const WORD_TARGETS: Record<string, string> = {
  short: 'about 200 words',
  medium: 'about 500 words',
  long: 'about 900 words',
};

const STRUCTURES: Option[] = [
  { value: 'flowing prose with no headings', label: 'Flowing prose' },
  { value: 'sections with descriptive headings', label: 'Sections with headings' },
  { value: 'an introduction, bulleted body points, and a conclusion', label: 'Intro + bullets + conclusion' },
];

const WriterPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].value);
  const [tone, setTone] = useState(TONES[0].value);
  const [length, setLength] = useState(LENGTHS[1].value);
  const [structure, setStructure] = useState(STRUCTURES[0].value);
  const [audience, setAudience] = useState('');
  const [keyPoints, setKeyPoints] = useState('');

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setTopic('');
    setAudience('');
    setKeyPoints('');
    reset();
  };

  /** Turn the form into an explicit brief instead of sending a bare topic. */
  const buildBrief = () => {
    const lines = [
      `Write a ${contentType} about: ${topic.trim()}`,
      `Intended audience: ${audience.trim() || 'a general audience'}`,
      `Tone: ${tone}`,
      `Structure: ${structure}`,
      `Target length: ${WORD_TARGETS[length]}`,
    ];

    if (keyPoints.trim()) {
      lines.push(`Points that must be covered:\n${keyPoints.trim()}`);
    }

    lines.push(
      'Return only the finished piece, formatted in Markdown. Do not describe the task or add commentary.'
    );

    return lines.join('\n');
  };

  const handleWrite = () => {
    if (!topic.trim() || isLoading) return;
    run(() => services.postWriter(buildBrief()));
  };

  const brief = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Writing brief
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <TextAreaField
          id="writer-topic"
          label="What should we write about?"
          value={topic}
          onChange={setTopic}
          placeholder="e.g., How small teams can adopt AI tooling without slowing down"
          disabled={isLoading}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            id="writer-type"
            label="Content type"
            value={contentType}
            options={CONTENT_TYPES}
            onChange={setContentType}
            disabled={isLoading}
          />
          <SelectField
            id="writer-tone"
            label="Tone"
            value={tone}
            options={TONES}
            onChange={setTone}
            disabled={isLoading}
          />
          <SelectField
            id="writer-length"
            label="Length"
            value={length}
            options={LENGTHS}
            onChange={setLength}
            disabled={isLoading}
          />
          <SelectField
            id="writer-structure"
            label="Structure"
            value={structure}
            options={STRUCTURES}
            onChange={setStructure}
            disabled={isLoading}
          />
        </div>

        <TextField
          id="writer-audience"
          label="Audience"
          value={audience}
          onChange={setAudience}
          placeholder="e.g., engineering managers at early-stage startups"
          disabled={isLoading}
          hint="Optional — defaults to a general audience."
        />

        <TextAreaField
          id="writer-key-points"
          label="Key points to include"
          value={keyPoints}
          onChange={setKeyPoints}
          placeholder={'e.g.\n- Start with one workflow\n- Measure before and after\n- Keep a human reviewer'}
          disabled={isLoading}
          rows={4}
          hint="Optional — one point per line."
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Writer"
      description="Turn a brief into a finished draft. Describe the topic, pick the format and tone, and the model writes the piece for you."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleWrite}
          disabled={!topic.trim()}
          isLoading={isLoading}
          loadingLabel="Writing..."
        >
          Write draft
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={brief}
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title="Draft"
            loadingLabel="Writing your draft..."
            downloadName="draft"
            placeholderText="Fill in the brief and your draft will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default WriterPage;
