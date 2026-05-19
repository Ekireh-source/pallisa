import { z } from "zod";

export const CompetencyAreaSchema = z.object({
  topic: z.number().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

export type ICompetencyAreaInput = z.infer<typeof CompetencyAreaSchema>;

export const TopicSchema = z.object({
  subject: z.number().min(1, "Subject is required"),
  class_obj: z.number().min(1, "Class is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

export const ActivitySchema = z.object({
  topic: z.number().min(1, "Topic is required"),
  teacher: z.number().optional().nullable(),
  term: z.number().min(1, "Term is required"),
  competency_area: z.number().optional().nullable(),
  max_score: z.number().min(1),
});

export const IntegrationScoreSchema = z.object({
  student: z.number().min(1),
  activity: z.number().min(1),
  score: z.number().min(0),
  teacher_remarks: z.string().optional().nullable(),
});

export const ExamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  term: z.number().min(1, "Term is required"),
  class_obj: z.any(), // Allow number or 'all' string
  start_date: z.string(), // ISO date
  end_date: z.string(),   // ISO date
  is_published: z.boolean().optional(),
});

export const ExamScoreSchema = z.object({
  exam: z.number().min(1),
  student: z.number().min(1),
  subject: z.number().min(1),
  score: z.number().min(0).max(100),
  remarks: z.string().optional().nullable(),
});

export const CompetencyAreaListSchema = z.object({
  id: z.number(),
  name: z.string(),
  topic: z.number().optional().nullable(),
  topic_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const TopicListSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  subject: z.number(),
  subject_name: z.string().optional().nullable(),
  class_obj: z.number(),
  class_name: z.string().optional().nullable(),
});

export const ActivityListSchema = z.object({
  id: z.string().or(z.number()),
  public_id: z.string(),
  topic: z.number(),
  topic_name: z.string().optional().nullable(),
  subject_name: z.string().optional().nullable(),
  competency_area: z.number().optional().nullable(),
  competency_area_name: z.string().optional().nullable(),
  term: z.number(),
  term_name: z.string().optional().nullable(),
  max_score: z.number(),
  teacher: z.number().optional().nullable(),
  teacher_name: z.string().optional().nullable(),
});

export const ExamListSchema = z.object({
  id: z.string().or(z.number()),
  public_id: z.string(),
  name: z.string(),
  class_obj: z.any(),
  class_name: z.string().optional().nullable(),
  term: z.number(),
  term_name: z.string().optional().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  is_published: z.boolean(),
});

export type ITopicInput = z.infer<typeof TopicSchema>;
export type IActivityInput = z.infer<typeof ActivitySchema>;
export type IIntegrationScoreInput = z.infer<typeof IntegrationScoreSchema>;
export type IExamInput = z.infer<typeof ExamSchema>;
export type IExamScoreInput = z.infer<typeof ExamScoreSchema>;

export type ICompetencyAreaListResponse = z.infer<typeof CompetencyAreaListSchema>;
export type ITopicListResponse = z.infer<typeof TopicListSchema>;
export type IActivityListResponse = z.infer<typeof ActivityListSchema>;
export type IExamListResponse = z.infer<typeof ExamListSchema>;


// --- Projects Evaluation Matrix ---
export const ProjectScoreSchema = z.object({
  student: z.number(),
  subject: z.number(),
  competency_number: z.number(),
  sub_criteria: z.string(),
  score: z.number(),
});

export const ProjectBulkSaveSchema = z.object({
  subject_id: z.number(),
  competency_number: z.number(),
  records: z.array(z.object({
    student_id: z.number(),
    sub_criteria: z.string(),
    score: z.number()
  }))
});


// --- Summative Assessment (SA) Matrix ---
export const SaAssessmentSchema = z.object({
  stream: z.number().min(1, "Stream class is required"),
  subject: z.number().min(1, "Subject is required"),
  term: z.number().min(1, "Term is required"),
  academic_year: z.number().min(1, "Academic Year is required"),
  total_box: z.number().default(10.00),
  teacher: z.number().optional().nullable(),
});

export const SaScoreSchema = z.object({
  student: z.number(),
  l1: z.number().nullable().optional(),
  g1: z.number().nullable().optional(),
  l2: z.number().nullable().optional(),
  g2: z.number().nullable().optional(),
  l3: z.number().nullable().optional(),
  g3: z.number().nullable().optional(),
  l4: z.number().nullable().optional(),
  g4: z.number().nullable().optional(),
  l5: z.number().nullable().optional(),
  g5: z.number().nullable().optional(),
});

export const SaBulkSaveSchema = z.object({
  stream_id: z.number(),
  subject_id: z.number(),
  total_box: z.number(),
  records: z.array(z.object({
    student_id: z.number(),
    l1: z.number().nullable().optional(),
    g1: z.number().nullable().optional(),
    l2: z.number().nullable().optional(),
    g2: z.number().nullable().optional(),
    l3: z.number().nullable().optional(),
    g3: z.number().nullable().optional(),
    l4: z.number().nullable().optional(),
    g4: z.number().nullable().optional(),
    l5: z.number().nullable().optional(),
    g5: z.number().nullable().optional(),
  }))
});

export const SaAssessmentBulkSaveSchema = z.object({
  records: z.array(z.object({
    student_id: z.number(),
    l1: z.number().nullable().optional(),
    g1: z.number().nullable().optional(),
    l2: z.number().nullable().optional(),
    g2: z.number().nullable().optional(),
    l3: z.number().nullable().optional(),
    g3: z.number().nullable().optional(),
    l4: z.number().nullable().optional(),
    g4: z.number().nullable().optional(),
    l5: z.number().nullable().optional(),
    g5: z.number().nullable().optional(),
  }))
});

export type IProjectScoreInput = z.infer<typeof ProjectScoreSchema>;
export type IProjectBulkSaveInput = z.infer<typeof ProjectBulkSaveSchema>;
export type ISaAssessmentInput = z.infer<typeof SaAssessmentSchema>;
export type ISaScoreInput = z.infer<typeof SaScoreSchema>;
export type ISaBulkSaveInput = z.infer<typeof SaBulkSaveSchema>;
export type ISaAssessmentBulkSaveInput = z.infer<typeof SaAssessmentBulkSaveSchema>;

