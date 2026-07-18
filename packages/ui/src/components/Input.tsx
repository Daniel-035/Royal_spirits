import { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'h-11 rounded-rs border bg-rs-surface-lowest px-3 text-base text-rs-on-surface',
            'placeholder:text-rs-outline-variant focus:outline-none',
            error
              ? 'border-rs-error focus:border-rs-error'
              : 'border-rs-outline-variant focus:border-rs-secondary',
            className,
          ].join(' ')}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? (
          <span className="text-xs text-rs-error">{error}</span>
        ) : hint ? (
          <span className="text-xs text-rs-on-surface-variant">{hint}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
