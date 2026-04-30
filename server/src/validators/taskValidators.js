import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const dueDateSchema = z
  .union([z.string().datetime(), z.string().length(0), z.null()])
  .optional()
  .transform((v) => (v && v.length > 0 ? new Date(v) : null));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  assignee: objectId.nullable().optional(),
  status: z.enum(TASK_STATUSES).optional().default('todo'),
  priority: z.enum(TASK_PRIORITIES).optional().default('medium'),
  dueDate: dueDateSchema,
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assignee: objectId.nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: dueDateSchema,
});

export const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});
