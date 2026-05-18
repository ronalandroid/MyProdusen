import React from 'react';
import { Loader2 } from 'lucide-react';

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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 active:scale-[0.98]';
  
  const variantStyles = {
    primary: 'bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--primary-light)] shadow-sm hover:shadow-md',
    secondary: 'bg-white text-[var(--text-primary)] border-2 border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-muted)] focus-visible:ring-[var(--border-color)]',
    danger: 'bg-[var(--danger)] text-white hover:bg-red-600 focus-visible:ring-red-200 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-[var(--bg-hover)]',
    success: 'bg-[var(--success)] text-white hover:bg-green-600 focus-visible:ring-green-200 shadow-sm hover:shadow-md',
    warning: 'bg-[var(--warning)] text-[var(--text-primary)] hover:bg-orange-500 focus-visible:ring-orange-200 shadow-sm hover:shadow-md',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs gap-1.5 min-h-[36px]',
    md: 'px-5 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[52px]',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize[size]} className="animate-spin" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}
