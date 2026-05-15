export function canIncludeOvertimeInPayroll(input: { status: string; isPaid: boolean }): boolean {
  return input.status === 'APPROVED' && !input.isPaid;
}

export function calculateOvertimeHourlyRate(baseSalary: number): number {
  return baseSalary / 173;
}
