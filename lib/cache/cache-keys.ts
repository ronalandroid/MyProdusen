export const CacheKeys = {
  // Employee cache keys
  employees: {
    list: (role?: string, teamId?: string) => {
      const parts = ['employees', 'list'];
      if (role) parts.push(`role:${role}`);
      if (teamId) parts.push(`team:${teamId}`);
      return parts.join(':');
    },
    detail: (id: string) => `employees:detail:${id}`,
    count: () => 'employees:count',
    byTeam: (teamId: string) => `employees:team:${teamId}`,
  },

  // Attendance cache keys
  attendance: {
    today: (employeeId?: string) => 
      employeeId ? `attendance:today:${employeeId}` : 'attendance:today:all',
    list: (date?: string, employeeId?: string) => {
      const parts = ['attendance', 'list'];
      if (date) parts.push(`date:${date}`);
      if (employeeId) parts.push(`emp:${employeeId}`);
      return parts.join(':');
    },
    summary: (employeeId: string, month: string) => 
      `attendance:summary:${employeeId}:${month}`,
    stats: (date: string) => `attendance:stats:${date}`,
  },

  // Work location cache keys
  workLocations: {
    active: () => 'work-locations:active',
    detail: (id: string) => `work-locations:detail:${id}`,
    list: () => 'work-locations:list',
  },

  // Shift cache keys
  shifts: {
    active: () => 'shifts:active',
    detail: (id: string) => `shifts:detail:${id}`,
    list: () => 'shifts:list',
  },

  // Leave request cache keys
  leave: {
    pending: (supervisorId: string) => `leave:pending:supervisor:${supervisorId}`,
    list: (employeeId?: string, status?: string) => {
      const parts = ['leave', 'list'];
      if (employeeId) parts.push(`emp:${employeeId}`);
      if (status) parts.push(`status:${status}`);
      return parts.join(':');
    },
    detail: (id: string) => `leave:detail:${id}`,
  },

  // Dashboard cache keys
  dashboard: {
    stats: (date?: string) => 
      date ? `dashboard:stats:${date}` : 'dashboard:stats:today',
    charts: (period: string) => `dashboard:charts:${period}`,
    summary: () => 'dashboard:summary',
  },

  // Rate limiting keys
  rateLimit: {
    key: (identifier: string, endpoint: string) => 
      `rate-limit:${endpoint}:${identifier}`,
  },
};

export const CacheTags = {
  employees: 'employees',
  attendance: 'attendance',
  workLocations: 'work-locations',
  shifts: 'shifts',
  leave: 'leave',
  dashboard: 'dashboard',
};

export function invalidatePattern(pattern: string): string {
  return pattern.replace(/:[^:]+$/, ':*');
}
