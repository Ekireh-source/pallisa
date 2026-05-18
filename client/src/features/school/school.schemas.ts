import { z } from "zod";

export const CampusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  active: z.boolean(),
});

export const SchoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  motto: z.string().max(255, "Max 255 characters").optional().nullable(),
  campus: z.number().optional().nullable(),
  level: z.string().optional().nullable(),
  active: z.boolean(),
});

export const CampusListSchema = z.object({
  id: z.string().or(z.number()),
  public_id: z.string(),
  name: z.string(),
  email: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  active: z.boolean(),
});

export const SchoolListSchema = z.object({
  id: z.number(),
  public_id: z.string().optional().nullable(),
  name: z.string(),
  email: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  motto: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  campus: z.number().optional().nullable(),
  active: z.boolean(),
});

export type ICampusInput = z.infer<typeof CampusSchema>;
export type ISchoolInput = z.infer<typeof SchoolSchema>;
export type ICampusListResponse = z.infer<typeof CampusListSchema>;
export type ISchoolListResponse = z.infer<typeof SchoolListSchema>;
