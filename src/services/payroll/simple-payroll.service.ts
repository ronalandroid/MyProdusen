export type SimplePayrollInput = {
  baseSalary: number;
  kpiBonus?: number;
  holidayBonus?: number;
  manualAdditions?: number;
  lateDeduction?: number;
  halfDayDeduction?: number;
  manualDeductions?: number;
};

export function calculateSimplePayroll(input: SimplePayrollInput) {
  const baseSalary = Math.max(0, input.baseSalary || 0);
  const kpiBonus = Math.max(0, input.kpiBonus || 0);
  const holidayBonus = Math.max(0, input.holidayBonus || 0);
  const manualAdditions = Math.max(0, input.manualAdditions || 0);
  const lateDeduction = Math.max(0, input.lateDeduction || 0);
  const halfDayDeduction = Math.max(0, input.halfDayDeduction || 0);
  const manualDeductions = Math.max(0, input.manualDeductions || 0);
  const gross = baseSalary + kpiBonus + holidayBonus + manualAdditions;
  const deductions = lateDeduction + halfDayDeduction + manualDeductions;
  const netPay = Math.max(0, gross - deductions);
  return {
    gross,
    deductions,
    netPay,
    breakdown: [
      { label: 'Gaji dasar', amount: baseSalary, type: 'earning' as const },
      { label: 'Bonus KPI', amount: kpiBonus, type: 'earning' as const },
      { label: 'Bonus hari libur', amount: holidayBonus, type: 'earning' as const },
      { label: 'Tambahan manual', amount: manualAdditions, type: 'earning' as const },
      { label: 'Potongan keterlambatan', amount: lateDeduction, type: 'deduction' as const },
      { label: 'Potongan setengah hari', amount: halfDayDeduction, type: 'deduction' as const },
      { label: 'Potongan manual', amount: manualDeductions, type: 'deduction' as const },
    ].filter((item) => item.amount > 0),
  };
}
