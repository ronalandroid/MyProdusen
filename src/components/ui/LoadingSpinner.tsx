import React from 'react';
import { Loader2 } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
} as const;

const VARIANT_CLASSES = {
  primary: 'text-[var(--primary)]',
  secondary: 'text-[var(--text-muted)]',
  white: 'text-white',
} as const;

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  variant?: 'primary' | 'secondary' | 'white';
}

export default function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
  variant = 'primary',
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={`${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm font-medium text-[var(--text-secondary)] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-white/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label={message || 'Loading'}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
    >
      {spinner}
    </div>
  );
}
