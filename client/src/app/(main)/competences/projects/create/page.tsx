'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft,
  Save,
  Award,
  BookOpen,
  Users,
  Grid
} from 'lucide-react';
import {
  Button,
  Card,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui';
import StreamSearchableSelect from '@/components/selects/streamsearchableselect';
import SubjectSearchableSelect from '@/components/selects/subjectsearchableselect';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

const ProjectInitSchema = z.object({
  stream_id: z.string().min(1, "Stream is required"),
  subject_id: z.string().min(1, "Subject is required"),
  competency_number: z.string().min(1, "Competency is required"),
});

type IProjectInitInput = z.infer<typeof ProjectInitSchema>;

export default function CreateProjectMatrixPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<IProjectInitInput>({
    resolver: zodResolver ? zodResolver(ProjectInitSchema) : undefined, // fallback protection
    defaultValues: {
      stream_id: '',
      subject_id: '',
      competency_number: '1',
    }
  });

  const onSubmit = async (data: IProjectInitInput) => {
    setSubmitting(true);
    try {
      // Build our virtual public ID: streamId-subjectId-competencyNumber
      const virtualId = `${data.stream_id}-${data.subject_id}-${data.competency_number}`;
      toast.success("Initializing grading sheet matrix...");
      router.push(`/competences/projects/${virtualId}`);
    } catch (error) {
      toast.error("Failed to initialize project matrix");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_COMPETENCES}>
    <MainLayout
      title="Configure Project Matrix"
      description="Initialize student competency evaluations by configuring the class stream, subject, and active competency."
    >
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 rounded-full border-gray-200"
            onClick={() => router.push('/competences/projects')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold text-gray-500">Back to Projects List</span>
        </div>

        <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-500" />
                Class Stream
              </Label>
              <Controller
                name="stream_id"
                control={control}
                render={({ field }) => (
                  <StreamSearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Choose class stream"
                    triggerClassName="h-12 rounded-xl bg-white border-gray-200 shadow-sm w-full"
                  />
                )}
              />
              {errors.stream_id && (
                <p className="text-xs text-rose-500 font-semibold">{errors.stream_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-amber-500" />
                Select Subject
              </Label>
              <Controller
                name="subject_id"
                control={control}
                render={({ field }) => (
                  <SubjectSearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Choose subject"
                    triggerClassName="h-12 rounded-xl bg-white border-gray-200 shadow-sm w-full"
                  />
                )}
              />
              {errors.subject_id && (
                <p className="text-xs text-rose-500 font-semibold">{errors.subject_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center">
                <Award className="w-4 h-4 mr-2 text-emerald-500" />
                Active Competency Index
              </Label>
              <Controller
                name="competency_number"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm w-full text-left font-semibold">
                      <SelectValue placeholder="Select Competency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl p-1">
                      <SelectItem value="1" className="rounded-lg py-2.5 font-semibold">Competency 1 (C1 - 14 criteria)</SelectItem>
                      <SelectItem value="2" className="rounded-lg py-2.5 font-semibold">Competency 2 (C2 - 3 criteria)</SelectItem>
                      <SelectItem value="3" className="rounded-lg py-2.5 font-semibold">Competency 3 (C3 - 6 criteria)</SelectItem>
                      <SelectItem value="4" className="rounded-lg py-2.5 font-semibold">Competency 4 (C4 - 2 criteria)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.competency_number && (
                <p className="text-xs text-rose-500 font-semibold">{errors.competency_number.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all"
              disabled={submitting}
            >
              <Grid className="w-4 h-4 mr-2" />
              Initialize Grading Sheet
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
    </ProtectedComponent>
  );
}
