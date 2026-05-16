import { db, notifications } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export class NotificationService {
  async markAllAsRead(userId: string) {
    const result = await db
      .update(notifications)
      .set({ 
        isRead: true
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();

    return result.length;
  }

  async deleteNotification(id: string, userId: string) {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!notification) {
      throw new Error('Notifikasi tidak ditemukan');
    }

    if (notification.userId !== userId) {
      throw new Error('Anda tidak memiliki akses untuk menghapus notifikasi ini');
    }

    await db
      .delete(notifications)
      .where(eq(notifications.id, id));

    return notification;
  }

  async getUnreadCount(userId: string) {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result.length;
  }
}

export const notificationService = new NotificationService();
