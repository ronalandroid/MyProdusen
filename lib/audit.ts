import { auditService } from '@/features/audit/audit.service';
import { NextRequest } from 'next/server';
import { getClientIp, getUserAgent } from './middleware';

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
]);

function isSensitiveKey(key: string) {
  const normalizedKey = key.toLowerCase();
  return SENSITIVE_KEYS.has(key) || normalizedKey.includes('password') || normalizedKey.includes('token') || normalizedKey.includes('secret');
}

function sanitizeAuditValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSensitiveKey(key) ? '[REDACTED]' : sanitizeAuditValue(entry),
      ])
    );
  }

  return value;
}

function stringifyAuditValue(value: any) {
  return value ? JSON.stringify(sanitizeAuditValue(value)) : undefined;
}

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  request?: NextRequest
) {
  try {
    await auditService.log({
      userId,
      action,
      entity,
      entityId,
      oldValue: stringifyAuditValue(oldValue),
      newValue: stringifyAuditValue(newValue),
      ipAddress: request ? getClientIp(request) : undefined,
      userAgent: request ? getUserAgent(request) : undefined,
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}
