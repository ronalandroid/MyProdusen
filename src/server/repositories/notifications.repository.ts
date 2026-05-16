import { db, notifications } from '@/lib/db';
import { and, desc, eq, sql } from 'drizzle-orm';

export type NotificationRecord = typeof notifications.$inferSelect;
export type CreateNotificationInput = typeof notifications.$inferInsert;

export class NotificationRepository {
  async listForUser(userId: string, options: { unreadOnly?: boolean; limit: number; offset: number }) {
    const whereClause = and(
      eq(notifications.userId, userId),
      options.unreadOnly ? eq(notifications.isRead, false) : undefined,
    );

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);

    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return {
      rows,
      total: totalResult?.count || 0,
    };
  }

  async findForUser(id: string, userId: string) {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    return notification || null;
  }

  async markAsRead(id: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    return updated || null;
  }

  async markAllAsRead(userId: string) {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning();

    return result.length;
  }

  async deleteForUser(id: string, userId: string) {
    const notification = await this.findForUser(id, userId);

    if (!notification) {
      return null;
    }

    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    return notification;
  }

  async getUnreadCount(userId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result?.count || 0;
  }

  async create(data: CreateNotificationInput) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }
}

export const notificationRepository = new NotificationRepository();
