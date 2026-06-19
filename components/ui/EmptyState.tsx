"use client";

import type { LucideIcon } from "lucide-react";
import { FileX, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}
      role="status"
    >
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--primary-light)" }}
        aria-hidden="true"
      >
        <Icon size={28} style={{ color: "var(--primary-dark)" }} strokeWidth={1.5} />
      </div>
      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {action && (
            <button type="button" className="btn btn-primary" onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button type="button" className="btn btn-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
