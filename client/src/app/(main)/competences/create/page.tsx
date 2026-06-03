'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  LayoutGrid,
  Loader2,
  FileText,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { CompetencyAreaSchema, ICompetencyAreaInput } from '@/features/exam/exam.schemas';
import { CreateCompetencyArea, FetchTopics } from '@/features/exam/exam.service';
import { FetchClasses, FetchTerms } from '@/features/members/members.service';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function CreateCompetencyAreaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ICompetencyAreaInput>({
    resolver: zodResolver(CompetencyAreaSchema),
    defaultValues: {
      topic: undefined,
      class_obj: undefined,
      term: undefined,
      name: '',
      description: '',
    }
  });

  const selectedTopic = watch('topic');
  const selectedClass = watch('class_obj');
  const selectedTerm = watch('term');

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [topicsRes, classRes, termRes] = await Promise.all([
        FetchTopics(),
        FetchClasses(),
        FetchTerms()
      ]);

      if (topicsRes && 'results' in topicsRes) {
        setTopics(topicsRes.results);
      } else {
        toast.error("Failed to load topics");
      }

      if (classRes && 'results' in classRes) {
        setClasses(classRes.results);
      }

      if (termRes && 'results' in termRes) {
        setTerms(termRes.results);
      }

      setFetchingData(false);
    };

    loadFormData();
  }, []);

  const onSubmit = async (data: ICompetencyAreaInput) => {
    setLoading(true);
    const result = await CreateCompetencyArea({ data });

    if (result.success) {
      toast.success("Competency area created successfully");
      router.push('/competences');
    } else {
      toast.error("Failed to create competency area");
    }
    setLoading(false);
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_COMPETENCES}>
      <MainLayout
        title="New Competency Area"
        description="Define a broad category for assessment activities."
        backButton={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      >
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-8 border-none  ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-primary" />
                      Target Class
                    </Label>
                    <Select
                      disabled={fetchingData}
                      value={selectedClass?.toString()}
                      onValueChange={(val) => setValue('class_obj', parseInt(val), { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.class_obj ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.class_obj && <ErrorMessage message="Class is required" />}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      Term
                    </Label>
                    <Select
                      disabled={fetchingData}
                      value={selectedTerm?.toString()}
                      onValueChange={(val) => setValue('term', parseInt(val), { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.term ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Term..." />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name} ({t.academic_year_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.term && <ErrorMessage message="Term is required" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-semibold text-My-Black flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    Linked Topic (Optional)
                  </Label>
                  <Select
                    disabled={fetchingData}
                    value={selectedTopic?.toString()}
                    onValueChange={(val) => setValue('topic', parseInt(val), { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.topic ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select a topic to link..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name} ({t.subject_name} - {t.class_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.topic && <ErrorMessage message={errors.topic.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-My-Black flex items-center">
                    <LayoutGrid className="w-4 h-4 mr-2 text-primary" />
                    Area Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Critical Thinking & Problem Solving"
                    className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-My-Black flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary" />
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe what this competency area covers..."
                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-primary"
                    {...register('description')}
                  />
                  {errors.description && <ErrorMessage message={errors.description.message} />}
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="h-12 rounded-xl px-8 text-gray-500"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 rounded-xl px-8  -primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Competency Area
              </Button>
            </div>
          </form>
        </div>
      </MainLayout>
    </ProtectedComponent>
  );
}
