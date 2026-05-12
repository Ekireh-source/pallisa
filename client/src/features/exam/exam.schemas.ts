import { z } from "zod";

export const CompetencyAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

export type ICompetencyAreaInput = z.infer<typeof CompetencyAreaSchema>;

export const TopicSchema = z.object({
  subject: z.coerce.number().min(1, "Subject is required"),
  class_obj: z.coerce.number().min(1, "Class is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

export const ActivitySchema = z.object({
  topic: z.coerce.number().min(1, "Topic is required"),
  teacher: z.coerce.number().optional().nullable(),
  term: z.coerce.number().min(1, "Term is required"),
  competency_area: z.coerce.number().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  scenario: z.string().min(1, "Scenario is required"),
  task_description: z.string().min(1, "Task description is required"),
  max_score: z.coerce.number().min(1).default(10),
});

export const IntegrationScoreSchema = z.object({
  student: z.coerce.number().min(1),
  activity: z.coerce.number().min(1),
  score: z.coerce.number().min(0),
  teacher_remarks: z.string().optional().nullable(),
});

export const ExamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  term: z.coerce.number().min(1, "Term is required"),
  class_obj: z.coerce.number().min(1, "Class is required"),
  start_date: z.string(), // ISO date
  end_date: z.string(),   // ISO date
  is_published: z.boolean().default(false),
});

export const ExamScoreSchema = z.object({
  exam: z.coerce.number().min(1),
  student: z.coerce.number().min(1),
  subject: z.coerce.number().min(1),
  score: z.coerce.number().min(0).max(100),
  remarks: z.string().optional().nullable(),
});

export type ITopicInput = z.infer<typeof TopicSchema>;
export type IActivityInput = z.infer<typeof ActivitySchema>;
export type IIntegrationScoreInput = z.infer<typeof IntegrationScoreSchema>;
export type IExamInput = z.infer<typeof ExamSchema>;
export type IExamScoreInput = z.infer<typeof ExamScoreSchema>;
