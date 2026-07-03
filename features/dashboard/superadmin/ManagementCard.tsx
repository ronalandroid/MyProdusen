import Link from "next/link";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { currencyFormatter, numberFormatter } from "./constants";
import { mapToneToColor } from "./helpers";

export function ManagementCard({ card, delay }: { card: SuperadminInsights['managementCards'][number]; delay?: string }) {
  return (
    <Link href={card.href} className={`card group animate-scale-in action-card-${card.tone} flex flex-col gap-2 p-4 transition-transform hover:-translate-y-1 hover:shadow-lg`} style={{ animationDelay: delay, borderColor: mapToneToColor(card.tone) }}>
      <span className="flex flex-col">
        <strong className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold uppercase tracking-wide">{card.label}</strong>
        <strong className="text-2xl sm:text-3xl mt-1 text-[var(--text-primary)]">
          {card.isCurrency ? currencyFormatter.format(card.value) : numberFormatter.format(card.value)}
        </strong>
      </span>
      <small className="text-xs sm:text-sm font-medium mt-auto" style={{ color: mapToneToColor(card.tone) }}>{card.detail}</small>
    </Link>
  );
}
