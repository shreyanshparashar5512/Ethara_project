import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional().default(''),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
});

export const addMemberSchema = z.object({
  userId: objectId,
  role: z.enum(['owner', 'member']).optional().default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'member']),
});
