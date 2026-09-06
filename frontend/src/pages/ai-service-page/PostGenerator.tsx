import React, { useState } from 'react';
import services from '../../services/services';
import { useAiTask } from '../../hooks/useAiTask';
import PageLayout from '../../components/PageLayout';
import InputPanel from '../../components/InputPanel';
import ResultDisplay from '../../components/ResultDisplay';
import TwoColumnLayout from '../../components/TwoColumnLayout';
import {
  CheckboxField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
  type Option,
} from '../../components/FormControls';

/**
 * Each platform has its own conventions — length, tone, how hashtags read —
 * so the platform is the control that changes the answer most.
 */
const PLATFORMS: Option[] = [
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'X (formerly Twitter)', label: 'X / Twitter' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'YouTube Shorts', label: 'YouTube Shorts' },
  { value: 'Threads', label: 'Threads' },
  { value: 'Pinterest', label: 'Pinterest' },
];

const TONES: Option[] = [
  { value: 'friendly and conversational', label: 'Friendly' },
  { value: 'professional and credible', label: 'Professional' },
  { value: 'playful and irreverent', label: 'Playful' },
  { value: 'bold and punchy', label: 'Bold' },
  { value: 'warm and personal', label: 'Warm' },
  { value: 'informative and plain', label: 'Informative' },
];

const LENGTHS: Option[] = [
  { value: 'one short line', label: 'One-liner' },
  { value: 'two or three short lines', label: 'Short' },
  { value: 'a medium caption of about 60 words', label: 'Medium' },
  { value: 'a longer post of about 150 words', label: 'Long' },
];

const PostGeneratorPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [tone, setTone] = useState(TONES[0].value);
  const [audience, setAudience] = useState('');
  const [postLength, setPostLength] = useState(LENGTHS[1].value);
  const [hashtagCount, setHashtagCount] = useState(5);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandKeywords, setBrandKeywords] = useState('');

  const { result, error, isLoading, run, reset } = useAiTask();

  const handleClear = () => {
    setInputText('');
    setAudience('');
    setBrandName('');
    setBrandKeywords('');
    reset();
  };

  const handleGenerate = () => {
    if (!inputText.trim() || isLoading) return;

    run(() =>
      services.createSocialPost({
        prompt: inputText.trim(),
        platform,
        tone,
        audience: audience.trim(),
        postLength,
        hashtagCount,
        includeEmojis,
        includeCta,
        brandName: brandName.trim(),
        brandKeywords: brandKeywords.trim(),
      })
    );
  };

  const controls = (
    <>
      <SelectField
        id="post-platform"
        label="Platform"
        value={platform}
        options={PLATFORMS}
        onChange={setPlatform}
        disabled={isLoading}
      />
      <SelectField
        id="post-tone"
        label="Tone"
        value={tone}
        options={TONES}
        onChange={setTone}
        disabled={isLoading}
      />
      <SelectField
        id="post-length"
        label="Length"
        value={postLength}
        options={LENGTHS}
        onChange={setPostLength}
        disabled={isLoading}
      />
      <NumberField
        id="post-hashtags"
        label="Hashtags"
        value={hashtagCount}
        onChange={setHashtagCount}
        min={0}
        max={30}
        hint="0 for none."
        disabled={isLoading}
      />
      <TextField
        id="post-audience"
        label="Audience (optional)"
        value={audience}
        onChange={setAudience}
        placeholder="e.g., first-time founders, home cooks"
        disabled={isLoading}
      />
      <TextField
        id="post-brand"
        label="Brand name (optional)"
        value={brandName}
        onChange={setBrandName}
        placeholder="e.g., Nevatal"
        disabled={isLoading}
      />
      <div className="sm:col-span-2">
        <TextField
          id="post-keywords"
          label="Words to work in (optional)"
          value={brandKeywords}
          onChange={setBrandKeywords}
          placeholder="Comma separated — product names, campaign phrases"
          disabled={isLoading}
        />
      </div>
      <CheckboxField
        id="post-emojis"
        label="Use emojis"
        checked={includeEmojis}
        onChange={setIncludeEmojis}
        disabled={isLoading}
      />
      <CheckboxField
        id="post-cta"
        label="End with a call to action"
        checked={includeCta}
        onChange={setIncludeCta}
        disabled={isLoading}
      />
    </>
  );

  return (
    <PageLayout
      title="Social Caption Generator"
      description="Captions and posts shaped for the platform they are going on — TikTok, Instagram, LinkedIn, X and the rest — with the hashtags, emojis and call to action you want."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleGenerate}
          disabled={!inputText.trim()}
          isLoading={isLoading}
          loadingLabel="Writing..."
        >
          Generate caption
        </SubmitButton>
      }
    >
      <TwoColumnLayout
        inputComponent={
          <InputPanel
            title="What is the post about?"
            value={inputText}
            onChange={setInputText}
            placeholder="Describe the product, moment, announcement or video this caption is for..."
            disabled={isLoading}
            controls={controls}
          />
        }
        resultComponent={
          <ResultDisplay
            isLoading={isLoading}
            resultText={result}
            title={`${platform} post`}
            loadingLabel="Writing the caption..."
            downloadName="caption"
            placeholderText="Your caption will appear here."
          />
        }
      />
    </PageLayout>
  );
};

export default PostGeneratorPage;
