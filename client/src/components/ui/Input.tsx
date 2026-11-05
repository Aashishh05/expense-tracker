import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/utils/format';

interface InputProps extends ComponentPropsWithRef<'input'> {
  label?: string;
  error?: string;
  hint?: string;
}

interface SelectProps extends ComponentPropsWithRef<'select'> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        className={cn('input', error && 'input-error', className)}
        {...rest}
      />
      {hint && !error && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export function Select({ label, error, hint, id, className, children, ...rest }: SelectProps) {
  const selectId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label className="label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={Boolean(error) || undefined}
        className={cn('input pr-8', error && 'input-error', className)}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
