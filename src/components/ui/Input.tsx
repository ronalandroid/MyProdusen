import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--text-primary)] mb-2"
          >
            {label}
            {required && <span className="text-[var(--danger)] ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`
              w-full px-4 py-3 text-sm font-medium
              bg-[var(--bg-input)] text-[var(--text-primary)]
              border-2 rounded-xl
              transition-all duration-200
              placeholder:text-[var(--text-muted)] placeholder:font-normal
              focus:outline-none focus:ring-4
              disabled:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60
              ${hasError 
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-red-100' 
                : 'border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-[var(--primary-light)]'
              }
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {icon}
            </div>
          )}
          
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--danger)]">
              <AlertCircle size={18} aria-hidden="true" />
            </div>
          )}
        </div>
        
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-xs font-medium text-[var(--danger)] flex items-center gap-1"
            role="alert"
          >
            <AlertCircle size={14} aria-hidden="true" />
            {error}
          </p>
        )}
        
        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-xs text-[var(--text-muted)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
