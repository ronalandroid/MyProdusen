/**
 * Generate NIP (Nomor Induk Pegawai) for new employees
 * Format: YYMMDD-XXXX
 * YYMMDD = Join date
 * XXXX = Sequential number (padded to 4 digits)
 */
export function generateNIP(joinDate: Date, sequenceNumber: number): string {
  const year = joinDate.getFullYear().toString().slice(-2);
  const month = (joinDate.getMonth() + 1).toString().padStart(2, '0');
  const day = joinDate.getDate().toString().padStart(2, '0');
  const sequence = sequenceNumber.toString().padStart(4, '0');
  
  return `${year}${month}${day}-${sequence}`;
}

/**
 * Parse NIP to extract join date and sequence
 */
export function parseNIP(nip: string): { joinDate: Date; sequence: number } | null {
  const match = nip.match(/^(\d{2})(\d{2})(\d{2})-(\d{4})$/);
  if (!match) return null;
  
  const [, year, month, day, sequence] = match;
  const fullYear = 2000 + parseInt(year);
  const joinDate = new Date(fullYear, parseInt(month) - 1, parseInt(day));
  
  return {
    joinDate,
    sequence: parseInt(sequence),
  };
}

/**
 * Get next available NIP for a given join date
 */
export async function getNextNIP(joinDate: Date, existingNIPs: string[]): Promise<string> {
  const datePrefix = generateNIP(joinDate, 0).split('-')[0];
  
  // Filter NIPs with same date prefix
  const sameDate = existingNIPs
    .filter(nip => nip.startsWith(datePrefix))
    .map(nip => {
      const parsed = parseNIP(nip);
      return parsed ? parsed.sequence : 0;
    });
  
  // Get max sequence number
  const maxSequence = sameDate.length > 0 ? Math.max(...sameDate) : 0;
  const nextSequence = maxSequence + 1;
  
  return generateNIP(joinDate, nextSequence);
}
