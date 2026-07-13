"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { resolveBerandaReminders, type BerandaReminderInput } from "./beranda-reminders";

type Props = Omit<BerandaReminderInput, "now">;

const SESSION_PREFIX = "myprodusen_beranda_reminder_";
const TOAST_DURATION_MS = 9000;
const STAGGER_MS = 700;

function wasShownThisSession(id: string): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_PREFIX + id) === "1";
  } catch {
    return false;
  }
}

function markShown(id: string) {
  try {
    window.sessionStorage.setItem(SESSION_PREFIX + id, "1");
  } catch {
    // Private mode without storage: the reminder simply repeats next visit.
  }
}

/**
 * Turns beranda status into pop-up reminders that appear only when relevant,
 * at most once per browser session each, instead of permanent banner clutter.
 */
export function BerandaReminderToasts(props: Props) {
  const { showToast } = useToast();

  useEffect(() => {
    const reminders = resolveBerandaReminders({ ...props, now: new Date() }).filter(
      (reminder) => !wasShownThisSession(reminder.id),
    );

    const timers = reminders.map((reminder, index) =>
      window.setTimeout(() => {
        markShown(reminder.id);
        showToast(reminder.tone === "warning" ? "warning" : "info", reminder.message, TOAST_DURATION_MS);
      }, 600 + index * STAGGER_MS),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive inputs listed explicitly; `props` identity changes every render
  }, [
    props.hasShift,
    props.hasLocation,
    props.hasProfilePhoto,
    props.hasPhone,
    props.hasAddress,
    props.hasCheckedIn,
    props.hasCheckedOut,
    props.shiftStartTime,
    props.shiftEndTime,
    props.isOutsideRadius,
    showToast,
  ]);

  return null;
}
