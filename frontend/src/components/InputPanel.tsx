import React from 'react';
import { countWords } from '../utils/text';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  /** Tool-specific controls rendered between the header and the textarea. */
  controls?: React.ReactNode;
  minHeight?: string;
}

/**
 * The "your text goes here" card shared by every text tool: paste button,
 * live word count, and a slot for the controls that make each tool different.
 */
const InputPanel: React.FC<InputPanelProps> = ({
  value,
  onChange,
  placeholder = 'Enter your text here...',
  title = 'Input',
  disabled,
  controls,
  minHeight = 'min-h-[16rem]',
}) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch {
      // Reading the clipboard needs permission; the user can still type.
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[20rem]">
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        <button
          type="button"
          onClick={handlePaste}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
          disabled={disabled}
        >
          Paste
        </button>
      </div>

      {controls && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {controls}
        </div>
      )}

      <textarea
        className={`w-full flex-grow ${minHeight} p-4 resize-y text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:bg-gray-50`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />

      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 flex justify-between">
        <span>{countWords(value)} words</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};

export default InputPanel;
