"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// How long the slide-out lasts before the node is removed from the DOM.
const EXIT_MS = 260;

const TOAST_ICONS = {
  success: <CheckCircle size={20} aria-hidden="true" />,
  error: <XCircle size={20} aria-hidden="true" />,
  warning: <AlertCircle size={20} aria-hidden="true" />,
  info: <Info size={20} aria-hidden="true" />,
} as const;

const TOAST_STYLES = {
  success: 'bg-[var(--success)] text-white border-[var(--success)]',
  error: 'bg-[var(--danger)] text-white border-[var(--danger)]',
  warning: 'bg-[var(--warning)] text-[var(--text-primary)] border-[var(--warning)]',
  info: 'bg-[var(--info)] text-white border-[var(--info)]',
} as const;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Auto-dismiss is now owned by ToastItem so it can animate out first.
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => showToast('success', message, duration), [showToast]);
  const error = useCallback((message: string, duration?: number) => showToast('error', message, duration), [showToast]);
  const warning = useCallback((message: string, duration?: number) => showToast('warning', message, duration), [showToast]);
  const info = useCallback((message: string, duration?: number) => showToast('info', message, duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[var(--z-tooltip)] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const toastId = toast.id;
  const duration = toast.duration ?? 5000;

  // Stable (onRemove is useCallback([]); toastId constant) so the effect runs
  // once — the enter/exit motion is CSS-driven, immune to parent re-renders.
  const beginLeave = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(toastId), EXIT_MS);
  }, [onRemove, toastId]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(beginLeave, duration);
    return () => clearTimeout(timer);
  }, [duration, beginLeave]);

  return (
    <div
      className={`
        ${TOAST_STYLES[toast.type]}
        relative overflow-hidden
        flex items-center gap-3 p-4 rounded-xl shadow-lg border-2
        backdrop-blur-sm
        ${leaving ? 'toast-leave' : 'toast-enter'}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">
        {TOAST_ICONS[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={beginLeave}
        className="
          flex-shrink-0 p-1 rounded-full
          hover:bg-white/20
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white
        "
        aria-label="Tutup notifikasi"
      >
        <X size={16} aria-hidden="true" />
      </button>
      {/* Time-remaining bar: CSS scaleX animation over the toast duration. */}
      {duration > 0 && !leaving && (
        <span
          aria-hidden="true"
          className="toast-progress-bar pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-white/40"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

export default ToastProvider;
