import { db } from '@/lib/db';
import {
  announcements,
  announcementReads,
  announcementComments,
  users,
  employees,
} from '@/drizzle/schema';
import { eq, and, desc, sql, or, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class AnnouncementService {
  // ============================================
  // ANNOUNCEMENT MANAGEMENT
  // ============================================

  async createAnnouncement(data: {
    title: string;
    content: string;
    category: 'GENERAL' | 'POLICY' | 'EVENT' | 'EMERGENCY';
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
    targetAudience: string;
    publishedBy: string;
    expiresAt?: Date;
    imageUrl?: string;
  }) {
    const [announcement] = await db
      .insert(announcements)
      .values({
        id: nanoid(),
        ...data,
        isPinned: data.priority === 'URGENT',
      })
      .returning();

    return announcement;
  }

  async getAnnouncements(filters?: {
    category?: string;
    priority?: string;
    isArchived?: boolean;
    userId?: string;
  }) {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(announcements.category, filters.category as any));
    }

    if (filters?.priority) {
      conditions.push(eq(announcements.priority, filters.priority as any));
    }

    if (filters?.isArchived !== undefined) {
      conditions.push(eq(announcements.isArchived, filters.isArchived));
    }

    // Check if not expired
    conditions.push(
      or(
        isNull(announcements.expiresAt),
        sql`${announcements.expiresAt} > NOW()`
      )
    );

    const results = await db
      .select({
        announcement: announcements,
        publisher: {
          id: users.id,
          username: users.username,
          email: users.email,
        },
        employee: {
          fullName: employees.fullName,
          profilePhoto: employees.profilePhoto,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.publishedBy, users.id))
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt));

    // If userId provided, check read status
    if (filters?.userId) {
      const announcementIds = results.map((r) => r.announcement.id);
      const reads = await db
        .select()
        .from(announcementReads)
        .where(
          and(
            sql`${announcementReads.announcementId} = ANY(${announcementIds})`,
            eq(announcementReads.userId, filters.userId)
          )
        );

      const readMap = new Map(reads.map((r) => [r.announcementId, true]));

      return results.map((r) => ({
        ...r,
        isRead: readMap.has(r.announcement.id),
      }));
    }

    return results;
  }

  async getAnnouncementById(id: string, userId?: string) {
    const [result] = await db
      .select({
        announcement: announcements,
        publisher: {
          id: users.id,
          username: users.username,
          email: users.email,
        },
        employee: {
          fullName: employees.fullName,
          profilePhoto: employees.profilePhoto,
        },
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.publishedBy, users.id))
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(announcements.id, id))
      .limit(1);

    if (!result) {
      throw new Error('Announcement tidak ditemukan');
    }

    // Get comments
    const comments = await this.getComments(id);

    // Check if user has read
    let isRead = false;
    if (userId) {
      const [read] = await db
        .select()
        .from(announcementReads)
        .where(
          and(
            eq(announcementReads.announcementId, id),
            eq(announcementReads.userId, userId)
          )
        )
        .limit(1);
      isRead = !!read;
    }

    return { ...result, comments, isRead };
  }

  async updateAnnouncement(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: 'GENERAL' | 'POLICY' | 'EVENT' | 'EMERGENCY';
      priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT';
      targetAudience?: string;
      expiresAt?: Date;
      imageUrl?: string;
      isPinned?: boolean;
      isArchived?: boolean;
    }
  ) {
    const [updated] = await db
      .update(announcements)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      throw new Error('Announcement tidak ditemukan');
    }

    return updated;
  }

  async deleteAnnouncement(id: string) {
    // Delete comments first
    await db
      .delete(announcementComments)
      .where(eq(announcementComments.announcementId, id));

    // Delete reads
    await db
      .delete(announcementReads)
      .where(eq(announcementReads.announcementId, id));

    // Delete announcement
    await db.delete(announcements).where(eq(announcements.id, id));

    return { success: true };
  }

  async pinAnnouncement(id: string, isPinned: boolean) {
    return await this.updateAnnouncement(id, { isPinned });
  }

  async archiveAnnouncement(id: string) {
    return await this.updateAnnouncement(id, { isArchived: true });
  }

  // ============================================
  // READ TRACKING
  // ============================================

  async markAsRead(announcementId: string, userId: string) {
    // Check if already read
    const [existing] = await db
      .select()
      .from(announcementReads)
      .where(
        and(
          eq(announcementReads.announcementId, announcementId),
          eq(announcementReads.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    const [read] = await db
      .insert(announcementReads)
      .values({
        id: nanoid(),
        announcementId,
        userId,
      })
      .returning();

    return read;
  }

  async getUnreadCount(userId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .leftJoin(
        announcementReads,
        and(
          eq(announcements.id, announcementReads.announcementId),
          eq(announcementReads.userId, userId)
        )
      )
      .where(
        and(
          eq(announcements.isArchived, false),
          isNull(announcementReads.id),
          or(
            isNull(announcements.expiresAt),
            sql`${announcements.expiresAt} > NOW()`
          )
        )
      );

    return Number(result?.count || 0);
  }

  async getReadStatus(announcementId: string) {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [reads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcementReads)
      .where(eq(announcementReads.announcementId, announcementId));

    return {
      totalUsers: Number(total?.count || 0),
      readCount: Number(reads?.count || 0),
      readPercentage:
        Number(total?.count || 0) > 0
          ? (Number(reads?.count || 0) / Number(total?.count || 0)) * 100
          : 0,
    };
  }

  // ============================================
  // COMMENTS
  // ============================================

  async addComment(data: {
    announcementId: string;
    userId: string;
    comment: string;
  }) {
    const [comment] = await db
      .insert(announcementComments)
      .values({
        id: nanoid(),
        ...data,
      })
      .returning();

    return comment;
  }

  async getComments(announcementId: string) {
    return await db
      .select({
        comment: announcementComments,
        user: {
          id: users.id,
          username: users.username,
        },
        employee: {
          fullName: employees.fullName,
          profilePhoto: employees.profilePhoto,
        },
      })
      .from(announcementComments)
      .leftJoin(users, eq(announcementComments.userId, users.id))
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(announcementComments.announcementId, announcementId))
      .orderBy(announcementComments.createdAt);
  }

  async deleteComment(id: string, userId: string) {
    const [comment] = await db
      .select()
      .from(announcementComments)
      .where(eq(announcementComments.id, id))
      .limit(1);

    if (!comment) {
      throw new Error('Comment tidak ditemukan');
    }

    if (comment.userId !== userId) {
      throw new Error('Tidak memiliki akses untuk menghapus comment ini');
    }

    await db
      .delete(announcementComments)
      .where(eq(announcementComments.id, id));

    return { success: true };
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStatistics() {
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(eq(announcements.isArchived, false));

    const [pinned] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(
        and(eq(announcements.isPinned, true), eq(announcements.isArchived, false))
      );

    const [urgent] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(
        and(
          eq(announcements.priority, 'URGENT'),
          eq(announcements.isArchived, false)
        )
      );

    const [thisMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(
        and(
          eq(announcements.isArchived, false),
          sql`${announcements.publishedAt} >= date_trunc('month', CURRENT_DATE)`
        )
      );

    return {
      total: Number(total?.count || 0),
      pinned: Number(pinned?.count || 0),
      urgent: Number(urgent?.count || 0),
      thisMonth: Number(thisMonth?.count || 0),
    };
  }
}

export const announcementService = new AnnouncementService();
