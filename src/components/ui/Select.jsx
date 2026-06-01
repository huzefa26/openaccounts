import { useState } from 'react';

export default function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
  disabled,
}) {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => setTouched(true);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-expense ml-0.5">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        className={`px-3 py-2 text-sm bg-surface border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
          touched && error ? 'border-error' : 'border-border hover:border-border-strong'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {touched && error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
