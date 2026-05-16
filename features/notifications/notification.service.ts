import { AppError } from '@/lib/core/app-error';
import { BaseService } from '@/lib/core/base-service';
import { notificationRepository, NotificationRepository } from '@/server/repositories/notifications.repository';

export class NotificationService extends BaseService {
  constructor(private readonly repository: NotificationRepository = notificationRepository) {
    super();
  }

  async listForUser(userId: string, options: { unreadOnly?: boolean; limit: number; offset: number }) {
    return this.repository.listForUser(userId, options);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repository.findForUser(id, userId);

    if (!notification) {
      throw AppError.notFound('Notifikasi tidak ditemukan');
    }

    const updated = await this.repository.markAsRead(id, userId);

    if (!updated) {
      throw AppError.notFound('Notifikasi tidak ditemukan');
    }

    return updated;
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string) {
    const deleted = await this.repository.deleteForUser(id, userId);

    if (!deleted) {
      throw AppError.notFound('Notifikasi tidak ditemukan');
    }

    return deleted;
  }

  async getUnreadCount(userId: string) {
    return this.repository.getUnreadCount(userId);
  }
}

export const notificationService = new NotificationService();
