import { forwardRef, type InputHTMLAttributes } from 'react';
import './Input.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="fl-field">
      {label && (
        <label className="fl-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={['fl-input', error ? 'fl-input--error' : '', className ?? ''].filter(Boolean).join(' ')}
        {...rest}
      />
      {error && <span className="fl-field__error">{error}</span>}
    </div>
  );
});
