import * as calculator from './kpi-calculator';
import * as period from './kpi-period';

export type { KpiScoringType } from './kpi-calculator';

// Thin orchestrator: composes the KPI calculator (score computation) and the
// KPI period/lifecycle modules. The public API (class + singleton instance)
// is intentionally unchanged — all logic lives in the focused modules.
export class KpiService {
  // Template Management
  createTemplate(data: { name: string; description?: string; createdBy: string }) {
    return period.createTemplate(data);
  }

  getTemplates(filters?: { isActive?: boolean }) {
    return period.getTemplates(filters);
  }

  getTemplateById(id: string) {
    return period.getTemplateById(id);
  }

  updateTemplate(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return period.updateTemplate(id, data);
  }

  deleteTemplate(id: string) {
    return period.deleteTemplate(id);
  }

  // KPI Item Management
  createItem(data: Parameters<typeof period.createItem>[0]) {
    return period.createItem(data);
  }

  updateItem(id: string, data: Parameters<typeof period.updateItem>[1]) {
    return period.updateItem(id, data);
  }

  deleteItem(id: string) {
    return period.deleteItem(id);
  }

  // KPI Assignment Management
  assignKpi(data: { employeeId: string; templateId: string; period: string; assignedBy: string }) {
    return period.assignKpi(data);
  }

  getAssignments(filters?: { employeeId?: string; period?: string }) {
    return period.getAssignments(filters);
  }

  // KPI Result Management
  submitResult(data: { employeeId: string; itemId: string; period: string; actualValue: number; notes?: string }) {
    return calculator.submitResult(data);
  }

  getResults(filters?: { employeeId?: string; period?: string; isApproved?: boolean }) {
    return period.getResults(filters);
  }

  getResultById(id: string) {
    return period.getResultById(id);
  }

  updateResult(id: string, data: { actualValue?: number; notes?: string }) {
    return calculator.updateResult(id, data);
  }

  approveResult(id: string, approvedBy: string) {
    return period.approveResult(id, approvedBy);
  }

  getEmployeeKpiSummary(employeeId: string, period: string) {
    return calculator.getEmployeeKpiSummary(employeeId, period);
  }

  // KPI Metrics
  createMetric(actorUserId: string, data: { name: string; unit: string; active?: boolean }) {
    return period.createMetric(actorUserId, data);
  }

  getMetrics(filters?: { active?: boolean }) {
    return period.getMetrics(filters);
  }

  getMetricById(id: string) {
    return period.getMetricById(id);
  }

  updateMetric(actorUserId: string, id: string, data: Partial<{ name: string; unit: string; active: boolean }>) {
    return period.updateMetric(actorUserId, id, data);
  }

  deleteMetric(actorUserId: string, id: string) {
    return period.deleteMetric(actorUserId, id);
  }

  // KPI Targets
  createTarget(actorUserId: string, data: Parameters<typeof period.createTarget>[1]) {
    return period.createTarget(actorUserId, data);
  }

  getTargets(filters?: { active?: boolean; scopeType?: string; scopeId?: string }) {
    return period.getTargets(filters);
  }

  getTargetById(id: string) {
    return period.getTargetById(id);
  }

  updateTarget(actorUserId: string, id: string, data: Partial<{ targetQuantity: number; active: boolean; effectiveFrom: Date; effectiveTo: Date }>) {
    return period.updateTarget(actorUserId, id, data);
  }

  deleteTarget(actorUserId: string, id: string) {
    return period.deleteTarget(actorUserId, id);
  }

  resolveActiveTarget(employeeId: string, metricId: string, targetDate = new Date()) {
    return period.resolveActiveTarget(employeeId, metricId, targetDate);
  }
}

export const kpiService = new KpiService();
