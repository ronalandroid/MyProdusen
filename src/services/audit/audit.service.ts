import { db, auditLogs } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogData {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(data: AuditLogData) {
    const id = uuidv4();
    const [log] = await db
      .insert(auditLogs)
      .values({
        id,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();

    return log;
  }

  async getLogs(filters?: {
    userId?: string;
    entity?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.entity) {
      conditions.push(eq(auditLogs.entity, filters.entity));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.from) {
      conditions.push(gte(auditLogs.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(auditLogs.createdAt, filters.to));
    }

    let query = db.select().from(auditLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(auditLogs.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return query;
  }

  async getLogById(id: string) {
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    if (!log) {
      throw new Error('Audit log tidak ditemukan');
    }

    return log;
  }
}

export const auditService = new AuditService();
