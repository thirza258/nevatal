import React, { useState } from 'react';
import services, { toApiError } from '../../services/services';
import type { GeneratedImage } from '../../interface';
import PageLayout from '../../components/PageLayout';
import { SelectField, SubmitButton, type Option } from '../../components/FormControls';

const STYLES: Option[] = [
  { value: '', label: 'No particular style' },
  { value: 'a photorealistic photograph', label: 'Photorealistic' },
  { value: 'a digital illustration', label: 'Illustration' },
  { value: 'a 3D render', label: '3D render' },
  { value: 'a watercolour painting', label: 'Watercolour' },
  { value: 'a minimal flat vector graphic', label: 'Flat vector' },
  { value: 'a pencil sketch', label: 'Pencil sketch' },
];

const ASPECTS: Option[] = [
  { value: '', label: 'No preference' },
  { value: 'square 1:1 framing', label: 'Square (1:1)' },
  { value: 'landscape 16:9 framing', label: 'Landscape (16:9)' },
  { value: 'portrait 3:4 framing', label: 'Portrait (3:4)' },
];

const ImaGenPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [aspect, setAspect] = useState('');
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClear = () => {
    setPrompt('');
    setImage(null);
    setError('');
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setImage(null);

    const description = [prompt.trim(), style && `Render it as ${style}.`, aspect && `Use ${aspect}.`]
      .filter(Boolean)
      .join(' ');

    try {
      setImage(await services.generateImage(description));
    } catch (err) {
      const apiError = toApiError(err);
      setError(
        apiError.message.toLowerCase().includes('not supported')
          ? `${apiError.message} Image generation runs on Google's image model, so it needs a Gemini API key.`
          : apiError.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  // The backend returns raw base64, not a URL — build the data URI here.
  const imageSrc = image
    ? `data:${image.mime_type};base64,${image.image_base64}`
    : '';

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${
      prompt.trim().slice(0, 40).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') ||
      'generated-image'
    }${image.extension || '.png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageLayout
      title="Image Generation"
      description="Describe an image and generate it. Be specific about subject, setting, and lighting — vague prompts give vague pictures."
      onClear={handleClear}
      error={error}
      actions={
        <SubmitButton
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          isLoading={isLoading}
          loadingLabel="Generating..."
        >
          Generate image
        </SubmitButton>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Prompt
            </h2>
          </div>

          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              id="image-style"
              label="Style"
              value={style}
              options={STYLES}
              onChange={setStyle}
              disabled={isLoading}
            />
            <SelectField
              id="image-aspect"
              label="Framing"
              value={aspect}
              options={ASPECTS}
              onChange={setAspect}
              disabled={isLoading}
            />
          </div>

          <textarea
            className="w-full flex-grow min-h-[14rem] p-4 resize-y text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:bg-gray-50"
            placeholder="e.g., A red fox sitting in tall grass at sunrise, backlit, shallow depth of field"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />

          <p className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            Requires a Google Gemini API key — OpenAI and OpenRouter keys cannot
            generate images here.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[24rem]">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Generated image
            </h2>
            <button
              type="button"
              onClick={handleDownload}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
              disabled={!image}
            >
              Download
            </button>
          </div>

          <div className="flex-grow p-4 flex items-center justify-center bg-gray-50">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <span className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                <p className="text-sm">Generating your image...</p>
              </div>
            ) : imageSrc ? (
              <img
                src={imageSrc}
                alt={prompt}
                className="max-h-[28rem] max-w-full object-contain rounded-md shadow-sm"
              />
            ) : (
              <p className="text-gray-400 text-sm">
                Your generated image will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ImaGenPage;
