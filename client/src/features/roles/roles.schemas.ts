import { z } from 'zod';

// ── Permission Category ────────────────────────────────────────────────────────
export const PermissionCategorySchema = z.object({
  id: z.number().nullable().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

// ── Permission ─────────────────────────────────────────────────────────────────
export const PermissionSchema = z.object({
  id: z.number().nullable().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: PermissionCategorySchema,
});

// ── Role (list / detail) ───────────────────────────────────────────────────────
export const RolePermissionSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_superadmin: z.boolean().optional().default(false),
  permissions: z.array(RolePermissionSchema).default([]),
});

// ── Create / Update input ──────────────────────────────────────────────────────
export const RoleInputSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

// ── Assign Permissions input ───────────────────────────────────────────────────
export const AssignPermissionsSchema = z.object({
  permission_ids: z.array(z.number()),
});

// ── Inferred TypeScript types ──────────────────────────────────────────────────
export type IPermissionCategory = z.infer<typeof PermissionCategorySchema>;
export type IPermission        = z.infer<typeof PermissionSchema>;
export type IRole              = z.infer<typeof RoleSchema>;
export type IRolePermission    = z.infer<typeof RolePermissionSchema>;
export type IRoleInput         = z.infer<typeof RoleInputSchema>;
export type IAssignPermissions = z.infer<typeof AssignPermissionsSchema>;
