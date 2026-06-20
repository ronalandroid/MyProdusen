import { describe, expect, it } from 'vitest';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '@/lib/announcements/schema';

// Regression guard: announcements created without an image used to fail
// silently because z.string().url() rejected the empty string the form sends.
describe('announcement validation schema', () => {
  const base = {
    title: 'Libur Idul Fitri',
    content: 'Kantor libur tanggal 1-3. Selamat hari raya!',
    category: 'GENERAL' as const,
    priority: 'NORMAL' as const,
  };

  it('accepts an announcement with a blank imageUrl', () => {
    const result = createAnnouncementSchema.safeParse({ ...base, imageUrl: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBeUndefined();
      expect(result.data.targetAudience).toBe('ALL');
    }
  });

  it('accepts an announcement with no imageUrl field at all', () => {
    const result = createAnnouncementSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('accepts a valid image URL', () => {
    const result = createAnnouncementSchema.safeParse({
      ...base,
      imageUrl: 'https://cdn.example.com/banner.png',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBe('https://cdn.example.com/banner.png');
    }
  });

  it('rejects a malformed image URL', () => {
    const result = createAnnouncementSchema.safeParse({
      ...base,
      imageUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('coerces a blank expiresAt to undefined instead of an Invalid Date', () => {
    const result = createAnnouncementSchema.safeParse({ ...base, expiresAt: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresAt).toBeUndefined();
    }
  });

  it('parses a provided expiresAt into a Date', () => {
    const result = createAnnouncementSchema.safeParse({
      ...base,
      expiresAt: '2026-12-31T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresAt).toBeInstanceOf(Date);
    }
  });

  it('rejects content shorter than 10 characters', () => {
    const result = createAnnouncementSchema.safeParse({ ...base, content: 'short' });
    expect(result.success).toBe(false);
  });

  it('allows a blank imageUrl on update too', () => {
    const result = updateAnnouncementSchema.safeParse({ imageUrl: '', isPinned: true });
    expect(result.success).toBe(true);
  });
});
