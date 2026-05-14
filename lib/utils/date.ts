/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format datetime to Indonesian locale
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate minutes between two times
 */
export function calculateMinutesDifference(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

/**
 * Calculate late minutes based on shift start time
 */
export function calculateLateMinutes(checkInTime: Date, shiftStartTime: string): number {
  const checkIn = new Date(checkInTime);
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  
  const shiftStart = new Date(checkIn);
  shiftStart.setHours(hours, minutes, 0, 0);
  
  if (checkIn <= shiftStart) return 0;
  
  return calculateMinutesDifference(shiftStart, checkIn);
}

/**
 * Calculate early leave minutes based on shift end time
 */
export function calculateEarlyLeaveMinutes(checkOutTime: Date, shiftEndTime: string): number {
  const checkOut = new Date(checkOutTime);
  const [hours, minutes] = shiftEndTime.split(':').map(Number);
  
  const shiftEnd = new Date(checkOut);
  shiftEnd.setHours(hours, minutes, 0, 0);
  
  if (checkOut >= shiftEnd) return 0;
  
  return calculateMinutesDifference(checkOut, shiftEnd);
}

/**
 * Get date range for a period (e.g., "2024-01" for monthly)
 */
export function getPeriodDateRange(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get current period string (YYYY-MM)
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}
