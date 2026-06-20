import { z } from 'zod';

// Optional form fields arrive as empty strings ('') from the browser when left
// blank. `z.string().url()` rejects '' which silently failed announcement
// creation — coerce blank/null to undefined before the URL check so an
// image-less announcement validates cleanly.
export const optionalUrl = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().url('URL gambar tidak valid').optional(),
);

const optionalDate = z.preprocess(
  (val) => (val === '' || val === null ? undefined : val),
  z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
);

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title wajib diisi'),
  content: z.string().min(10, 'Content minimal 10 karakter'),
  category: z.enum(['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  targetAudience: z.string().default('ALL'),
  expiresAt: optionalDate,
  imageUrl: optionalUrl,
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(10).optional(),
  category: z.enum(['GENERAL', 'POLICY', 'EVENT', 'EMERGENCY']).optional(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  targetAudience: z.string().optional(),
  expiresAt: optionalDate,
  imageUrl: optionalUrl,
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
