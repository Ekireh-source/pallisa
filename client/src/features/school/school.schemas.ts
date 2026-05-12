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
  email: z.string().email().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  campus: z.number().optional().nullable(), // ID of campus
  active: z.boolean(),
});

export type ICampusInput = z.infer<typeof CampusSchema>;
export type ISchoolInput = z.infer<typeof SchoolSchema>;
