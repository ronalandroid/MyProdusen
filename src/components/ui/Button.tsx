import React from 'react';
import { Loader2 } from 'lucide-react';

const BASE_STYLES = 'inline-flex max-w-full items-center justify-center font-semibold leading-tight rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 active:scale-[0.98]';
const VARIANT_STYLES = {
  primary: 'bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--primary-light)] shadow-sm hover:shadow-md',
  secondary: 'bg-white text-[var(--text-primary)] border-2 border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-muted)] focus-visible:ring-[var(--border-color)]',
  danger: 'bg-[var(--danger)] text-white hover:bg-red-600 focus-visible:ring-red-200 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-[var(--bg-hover)]',
  success: 'bg-[var(--success)] text-white hover:bg-green-600 focus-visible:ring-green-200 shadow-sm hover:shadow-md',
  warning: 'bg-[var(--warning)] text-[var(--text-primary)] hover:bg-orange-500 focus-visible:ring-orange-200 shadow-sm hover:shadow-md',
};
const SIZE_STYLES = {
  sm: 'px-3 py-2 text-xs gap-1.5 min-h-[44px]',
  md: 'px-5 py-2.5 text-sm gap-2 min-h-[44px]',
  lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[52px]',
};
const ICON_SIZE = {
  sm: 14,
  md: 16,
  lg: 18,
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
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
          <Loader2 size={ICON_SIZE[size]} className="shrink-0 animate-spin" aria-hidden="true" />
          <span className="min-w-0 text-center">{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
          )}
          <span className="min-w-0 text-center">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}
