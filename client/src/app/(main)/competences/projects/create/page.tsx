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
  SelectItem,
  Input
} from '@/components/ui';
import StreamSearchableSelect from '@/components/selects/streamsearchableselect';
import SubjectSearchableSelect from '@/components/selects/subjectsearchableselect';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { CreateNewProject } from '@/features/exam/exam.service';

const ProjectInitSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  stream_id: z.string().min(1, "Stream is required"),
  subject_id: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
});

type IProjectInitInput = z.infer<typeof ProjectInitSchema>;

export default function CreateProjectMatrixPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, register, formState: { errors } } = useForm<IProjectInitInput>({
    resolver: zodResolver ? zodResolver(ProjectInitSchema) : undefined,
    defaultValues: {
      name: '',
      stream_id: '',
      subject_id: '',
      description: '',
    }
  });

  const onSubmit = async (data: IProjectInitInput) => {
    setSubmitting(true);
    try {
      const res = await CreateNewProject({
        name: data.name,
        stream_id: data.stream_id,
        subject_id: data.subject_id,
        description: data.description,
      });

      if (res.success && res.data) {
        toast.success("Project created and initialized successfully!");
        router.push(`/competences/projects/${res.data.public_id}`);
      } else {
        toast.error("Failed to initialize project competency matrix");
      }
    } catch (error) {
      toast.error("Failed to initialize project matrix");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_COMPETENCES}>
    <MainLayout
      title="Create New Project Matrix"
      description="Initialize a new production-ready project evaluation workspace by defining its name, class stream, and subject."
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
                <Award className="w-4 h-4 mr-2 text-indigo-500" />
                Project Name
              </Label>
              <Input
                {...register("name")}
                placeholder="e.g. Making Liquid Soap, Crafting Local Baskets"
                className="h-12 rounded-xl border-gray-200 bg-white shadow-sm w-full text-base font-semibold"
              />
              {errors.name && (
                <p className="text-xs text-rose-500 font-semibold">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center">
                <Users className="w-4 h-4 mr-2 text-sky-500" />
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
                    triggerClassName="h-12 rounded-xl bg-white border-gray-200 shadow-sm w-full font-semibold text-base"
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
                    triggerClassName="h-12 rounded-xl bg-white border-gray-200 shadow-sm w-full font-semibold text-base"
                  />
                )}
              />
              {errors.subject_id && (
                <p className="text-xs text-rose-500 font-semibold">{errors.subject_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center">
                <Grid className="w-4 h-4 mr-2 text-emerald-500" />
                Project Description (Optional)
              </Label>
              <textarea
                {...register("description")}
                placeholder="Brief guidelines or project details..."
                className="w-full rounded-xl border border-gray-200 p-3 h-24 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 shadow-md shadow-primary/20 bg-primary hover:bg-primary/95 text-white font-bold transition-all text-base"
              disabled={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Project & Start Grading
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
    </ProtectedComponent>
  );
}
