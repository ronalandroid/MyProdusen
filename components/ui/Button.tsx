import React from 'react';

const BASE_STYLES = 'inline-flex min-h-[44px] max-w-full items-center justify-center gap-2 font-medium leading-tight rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const VARIANT_STYLES = {
  primary: 'bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)] active:scale-95',
  secondary: 'bg-white text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-gray-50 active:scale-95',
  danger: 'bg-[var(--danger)] text-white hover:bg-red-700 active:scale-95',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-gray-100 active:scale-95',
};
const SIZE_STYLES = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      aria-busy={loading || undefined}
      className={`${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="min-w-0 text-center">{children}</span>
        </>
      ) : (
        <span className="min-w-0 text-center">{children}</span>
      )}
    </button>
  );
}
