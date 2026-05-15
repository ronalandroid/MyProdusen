"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
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
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

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
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[var(--z-tooltip)] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle size={20} aria-hidden="true" />,
    error: <XCircle size={20} aria-hidden="true" />,
    warning: <AlertCircle size={20} aria-hidden="true" />,
    info: <Info size={20} aria-hidden="true" />,
  };

  const styles = {
    success: 'bg-[var(--success)] text-white border-[var(--success)]',
    error: 'bg-[var(--danger)] text-white border-[var(--danger)]',
    warning: 'bg-[var(--warning)] text-white border-[var(--warning)]',
    info: 'bg-[var(--info)] text-white border-[var(--info)]',
  };

  return (
    <div
      className={`
        ${styles[toast.type]}
        flex items-center gap-3 p-4 rounded-xl shadow-lg border-2
        animate-slide-up
        backdrop-blur-sm
      `}
      role="alert"
    >
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="
          flex-shrink-0 p-1 rounded-full
          hover:bg-white/20
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white
        "
        aria-label="Close notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default ToastProvider;
