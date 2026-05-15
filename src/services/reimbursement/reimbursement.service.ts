import { db } from '@/lib/db';
import {
  expenseCategories,
  expenseClaims,
  expenseItems,
  expenseReceipts,
  employees,
} from '@/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class ReimbursementService {
  // ============================================
  // EXPENSE CATEGORY MANAGEMENT
  // ============================================

  async createCategory(data: {
    name: string;
    description?: string;
    maxAmount?: number;
    requiresReceipt: boolean;
  }) {
    const [category] = await db
      .insert(expenseCategories)
      .values({
        id: nanoid(),
        ...data,
        isActive: true,
      })
      .returning();

    return category;
  }

  async getCategories(isActive?: boolean) {
    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(expenseCategories.isActive, isActive));
    }

    return await db
      .select()
      .from(expenseCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(expenseCategories.name);
  }

  async getCategoryById(id: string) {
    const [category] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, id))
      .limit(1);

    if (!category) {
      throw new Error('Kategori expense tidak ditemukan');
    }

    return category;
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      maxAmount?: number;
      requiresReceipt?: boolean;
      isActive?: boolean;
    }
  ) {
    const [updated] = await db
      .update(expenseCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(expenseCategories.id, id))
      .returning();

    if (!updated) {
      throw new Error('Kategori expense tidak ditemukan');
    }

    return updated;
  }

  async deleteCategory(id: string) {
    // Check if category is used
    const [usage] = await db
      .select()
      .from(expenseItems)
      .where(eq(expenseItems.categoryId, id))
      .limit(1);

    if (usage) {
      throw new Error('Kategori masih digunakan');
    }

    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));

    return { success: true };
  }

  // ============================================
  // EXPENSE CLAIM MANAGEMENT
  // ============================================

  async createClaim(data: {
    employeeId: string;
    claimDate: Date;
    description?: string;
    items: Array<{
      categoryId: string;
      description: string;
      amount: number;
      expenseDate: Date;
      receipts?: Array<{
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      }>;
    }>;
  }) {
    // Generate claim number
    const claimNumber = await this.generateClaimNumber();

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

    // Validate against category limits
    for (const item of data.items) {
      const category = await this.getCategoryById(item.categoryId);
      if (category.maxAmount && item.amount > category.maxAmount) {
        throw new Error(
          `Amount untuk ${category.name} melebihi batas maksimal Rp ${category.maxAmount}`
        );
      }

      if (category.requiresReceipt && (!item.receipts || item.receipts.length === 0)) {
        throw new Error(`Kategori ${category.name} memerlukan bukti receipt`);
      }
    }

    // Create claim
    const [claim] = await db
      .insert(expenseClaims)
      .values({
        id: nanoid(),
        employeeId: data.employeeId,
        claimNumber,
        claimDate: data.claimDate,
        totalAmount,
        description: data.description,
        status: 'PENDING',
      })
      .returning();

    // Create items and receipts
    for (const itemData of data.items) {
      const [item] = await db
        .insert(expenseItems)
        .values({
          id: nanoid(),
          claimId: claim.id,
          categoryId: itemData.categoryId,
          description: itemData.description,
          amount: itemData.amount,
          expenseDate: itemData.expenseDate,
        })
        .returning();

      // Add receipts
      if (itemData.receipts) {
        for (const receipt of itemData.receipts) {
          await db.insert(expenseReceipts).values({
            id: nanoid(),
            itemId: item.id,
            ...receipt,
          });
        }
      }
    }

    return claim;
  }

  private async generateClaimNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Get count for this month
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenseClaims)
      .where(sql`${expenseClaims.claimNumber} LIKE ${`EXP-${year}${month}-%`}`);

    const count = Number(result?.count || 0) + 1;
    const sequence = String(count).padStart(4, '0');

    return `EXP-${year}${month}-${sequence}`;
  }

  async getClaims(filters?: {
    employeeId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];

    if (filters?.employeeId) {
      conditions.push(eq(expenseClaims.employeeId, filters.employeeId));
    }

    if (filters?.status) {
      conditions.push(eq(expenseClaims.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(expenseClaims.claimDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(expenseClaims.claimDate, filters.endDate));
    }

    return await db
      .select({
        claim: expenseClaims,
        employee: employees,
      })
      .from(expenseClaims)
      .innerJoin(employees, eq(expenseClaims.employeeId, employees.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${expenseClaims.claimDate} DESC`);
  }

  async getClaimById(id: string) {
    const [result] = await db
      .select({
        claim: expenseClaims,
        employee: employees,
      })
      .from(expenseClaims)
      .innerJoin(employees, eq(expenseClaims.employeeId, employees.id))
      .where(eq(expenseClaims.id, id))
      .limit(1);

    if (!result) {
      throw new Error('Claim tidak ditemukan');
    }

    // Get items with receipts
    const items = await db
      .select({
        item: expenseItems,
        category: expenseCategories,
      })
      .from(expenseItems)
      .innerJoin(
        expenseCategories,
        eq(expenseItems.categoryId, expenseCategories.id)
      )
      .where(eq(expenseItems.claimId, id));

    // Get receipts for each item
    const itemsWithReceipts = await Promise.all(
      items.map(async ({ item, category }) => {
        const receipts = await db
          .select()
          .from(expenseReceipts)
          .where(eq(expenseReceipts.itemId, item.id));

        return { item, category, receipts };
      })
    );

    return { ...result, items: itemsWithReceipts };
  }

  async updateClaim(
    id: string,
    data: {
      claimDate?: Date;
      description?: string;
    }
  ) {
    const existing = await this.getClaimById(id);

    if (existing.claim.status !== 'PENDING') {
      throw new Error('Hanya claim dengan status PENDING yang bisa diubah');
    }

    const [updated] = await db
      .update(expenseClaims)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    return updated;
  }

  async approveClaim(id: string, approvedBy: string) {
    const existing = await this.getClaimById(id);

    if (existing.claim.status !== 'PENDING') {
      throw new Error('Claim sudah diproses');
    }

    const [updated] = await db
      .update(expenseClaims)
      .set({
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    return updated;
  }

  async rejectClaim(id: string, approvedBy: string, rejectedReason: string) {
    const existing = await this.getClaimById(id);

    if (existing.claim.status !== 'PENDING') {
      throw new Error('Claim sudah diproses');
    }

    const [updated] = await db
      .update(expenseClaims)
      .set({
        status: 'REJECTED',
        approvedBy,
        rejectedReason,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    return updated;
  }

  async markAsPaid(id: string, paidInPayrollRunId?: string) {
    const existing = await this.getClaimById(id);

    if (existing.claim.status !== 'APPROVED') {
      throw new Error('Hanya claim APPROVED yang bisa dibayar');
    }

    const [updated] = await db
      .update(expenseClaims)
      .set({
        status: 'PAID',
        isPaid: true,
        paidAt: new Date(),
        paidInPayrollRunId,
        updatedAt: new Date(),
      })
      .where(eq(expenseClaims.id, id))
      .returning();

    return updated;
  }

  async deleteClaim(id: string, employeeId: string) {
    const existing = await this.getClaimById(id);

    if (existing.claim.employeeId !== employeeId) {
      throw new Error('Tidak memiliki akses');
    }

    if (existing.claim.status !== 'PENDING') {
      throw new Error('Hanya claim PENDING yang bisa dihapus');
    }

    // Delete receipts
    for (const { item } of existing.items) {
      await db.delete(expenseReceipts).where(eq(expenseReceipts.itemId, item.id));
    }

    // Delete items
    await db.delete(expenseItems).where(eq(expenseItems.claimId, id));

    // Delete claim
    await db.delete(expenseClaims).where(eq(expenseClaims.id, id));

    return { success: true };
  }
}

export const reimbursementService = new ReimbursementService();
