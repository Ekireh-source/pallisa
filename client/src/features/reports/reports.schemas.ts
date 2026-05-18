import { z } from "zod";

export const GradingSystemListSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  boundaries: z.array(z.any()).optional().nullable(),
  is_active: z.boolean(),
});

export type IGradingSystemListResponse = z.infer<typeof GradingSystemListSchema>;
