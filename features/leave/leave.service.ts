import { prisma } from '@/lib/db';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { dateRangesOverlap } from '@/lib/utils/date';

export class LeaveService {
  async createLeaveRequest(data: {
    employeeId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    // Validate dates
    if (data.startDate > data.endDate) {
      throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
    }

    // Check for overlapping leave requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: data.employeeId,
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error('Anda sudah memiliki pengajuan izin/cuti pada tanggal tersebut');
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
      },
    });

    return leaveRequest;
  }

  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: LeaveStatus;
    type?: LeaveType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate;
      }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
            division: true,
            position: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return leaveRequests;
  }

  async getLeaveRequestById(id: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
            division: true,
            position: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    return leaveRequest;
  }

  async approveLeaveRequest(id: string, approvedBy: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new Error('Pengajuan sudah diproses');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
      },
    });

    // TODO: Create notification for employee

    return updated;
  }

  async rejectLeaveRequest(id: string, rejectedBy: string, reason: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new Error('Pengajuan tidak ditemukan');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new Error('Pengajuan sudah diproses');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
      },
    });

    // TODO: Create notification for employee

    return updated;
  }
}

export const leaveService = new LeaveService();
