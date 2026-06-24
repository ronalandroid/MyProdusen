"use client";

import Link from "next/link";
import { quickActions } from "./helpers";

export function QuickActionsGrid() {
  return (
    <section aria-labelledby="quick-actions-title">
      <div className="section-heading mb-3">
        <h2 id="quick-actions-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
          Menu Utama
        </h2>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              href={action.path}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-[var(--border-color)] p-3 text-center transition-all hover:shadow-md hover:border-[var(--primary)] min-h-[92px] group"
            >
              <div
                className="flex items-center justify-center rounded-2xl shrink-0 transition-transform group-hover:scale-105"
                style={{ width: 44, height: 44, backgroundColor: action.bg, color: action.text }}
                aria-hidden="true"
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight line-clamp-1 w-full">
                {action.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
