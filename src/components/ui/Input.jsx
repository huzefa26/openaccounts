import { useState } from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  disabled,
  className = '',
}) {
  const [touched, setTouched] = useState(false);

  const handleBlur = (e) => {
    setTouched(true);
    onBlur?.(e);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-expense ml-0.5">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`px-3 py-2 text-sm bg-surface border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent ${className} ${
          touched && error ? 'border-error' : 'border-border hover:border-border-strong'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {touched && error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
