// Payroll service orchestrator.
//
// This file composes focused modules into the public `payrollService` object.
// Behavior is unchanged from the previous single-file implementation; the
// methods simply delegate to extracted functions:
//   - payroll-config.ts     structure/component/assignment CRUD + rule engine + edit guards
//   - payroll-period.ts      run lifecycle, summaries, payslip/item reads
//   - payroll-calculator.ts  the payroll calculation engine
//
// Edit-guard invariant: finalized payroll cannot be edited directly.
// `assertStructureEditable` and `assertNoFinalPayrollForEmployee` enforce this
// by rejecting any structure/employee whose payroll run status is
// IN ('APPROVED', 'PAID'). Those guards live in payroll-config.ts and are
// re-exported below.

import * as config from './payroll-config';
import * as period from './payroll-period';
import { calculatePayroll } from './payroll-calculator';

export {
  assertStructureEditable,
  assertNoFinalPayrollForEmployee,
} from './payroll-config';

export class PayrollService {
  // ----- Structure management (payroll-config) -----
  createStructure = config.createStructure;
  getStructures = config.getStructures;
  getStructureById = config.getStructureById;
  updateStructure = config.updateStructure;
  deleteStructure = config.deleteStructure;

  // ----- Component management (payroll-config) -----
  addComponent = config.addComponent;
  updateComponent = config.updateComponent;
  deleteComponent = config.deleteComponent;

  // ----- Employee payroll assignment (payroll-config) -----
  assignPayrollToEmployee = config.assignPayrollToEmployee;
  getEmployeePayroll = config.getEmployeePayroll;
  updateEmployeePayroll = config.updateEmployeePayroll;

  // ----- Payroll run & calculation -----
  createPayrollRun = period.createPayrollRun;
  calculatePayroll = calculatePayroll;
  approvePayrollRun = period.approvePayrollRun;
  markPayrollRunPaid = period.markPayrollRunPaid;
  markPayrollRunUnpaid = period.markPayrollRunUnpaid;
  getPayrollRuns = period.getPayrollRuns;
  getPayrollSummary = period.getPayrollSummary;
  getPayrollRunById = period.getPayrollRunById;

  // ----- Payslip / item reads (payroll-period) -----
  getEmployeePayrollItems = period.getEmployeePayrollItems;
  getPayrollItemById = period.getPayrollItemById;
  getOrCreatePayslip = period.getOrCreatePayslip;
  markPayslipDownloaded = period.markPayslipDownloaded;

  // ----- Payroll target / bonus rule engine (payroll-config) -----
  createPayrollRule = config.createPayrollRule;
  getPayrollRules = config.getPayrollRules;
  getPayrollRuleById = config.getPayrollRuleById;
  updatePayrollRule = config.updatePayrollRule;
  deletePayrollRule = config.deletePayrollRule;
  resolveActivePayrollRule = config.resolveActivePayrollRule;

  // ----- Edit guards (finalized payroll protection) -----
  // Kept as private service helpers. The structure/component/assignment CRUD in
  // payroll-config.ts applies these guards before mutating any structure or
  // employee whose payroll run status is IN ('APPROVED', 'PAID').
  private assertStructureEditable = config.assertStructureEditable;
  private assertNoFinalPayrollForEmployee = config.assertNoFinalPayrollForEmployee;
}

export const payrollService = new PayrollService();
