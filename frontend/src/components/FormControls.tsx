import React from 'react';

const baseControl =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ' +
  'disabled:bg-gray-100 disabled:text-gray-500';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, htmlFor, hint, children }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    {hint && <span className="text-xs text-gray-500">{hint}</span>}
  </div>
);

export interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  hint,
}) => (
  <FieldWrapper label={label} htmlFor={id} hint={hint}>
    <select
      id={id}
      className={baseControl}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FieldWrapper>
);

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
}) => (
  <FieldWrapper label={label} htmlFor={id} hint={hint}>
    <input
      id={id}
      type="text"
      className={baseControl}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </FieldWrapper>
);

interface TextAreaFieldProps extends TextFieldProps {
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  rows = 3,
}) => (
  <FieldWrapper label={label} htmlFor={id} hint={hint}>
    <textarea
      id={id}
      className={`${baseControl} resize-y`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows}
    />
  </FieldWrapper>
);

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled,
}) => (
  <div className="flex items-center gap-2 self-end pb-2">
    <input
      id={id}
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    <label htmlFor={id} className="text-sm text-gray-700">
      {label}
    </label>
  </div>
);

interface SubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  loadingLabel = 'Working...',
  children,
}) => (
  <button
    type="button"
    className="min-w-[12rem] bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
    onClick={onClick}
    disabled={disabled || isLoading}
  >
    {isLoading ? loadingLabel : children}
  </button>
);
