import { checkIn } from '@/services/attendance/check-in-handler';
import { checkOut } from '@/services/attendance/check-out-handler';
import {
  getTodayAttendance,
  adjustAttendance,
  getAttendances,
  getSelfieReviewList,
} from '@/services/attendance/attendance-sync';
import type { AttendanceStatus, SelfieReviewItem } from '@/services/attendance/attendance-helpers';

export type { AttendanceStatus, SelfieReviewItem };

export class AttendanceService {
  checkIn(data: Parameters<typeof checkIn>[0]) {
    return checkIn(data);
  }

  checkOut(data: Parameters<typeof checkOut>[0]) {
    return checkOut(data);
  }

  getTodayAttendance(employeeId: string) {
    return getTodayAttendance(employeeId);
  }

  adjustAttendance(id: string, data: Parameters<typeof adjustAttendance>[1]) {
    return adjustAttendance(id, data);
  }

  getAttendances(filters?: Parameters<typeof getAttendances>[0]) {
    return getAttendances(filters);
  }

  getSelfieReviewList(filters?: Parameters<typeof getSelfieReviewList>[0]): Promise<SelfieReviewItem[]> {
    return getSelfieReviewList(filters);
  }
}

export const attendanceService = new AttendanceService();
