'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  Zap, 
  BookOpen, 
  User,
  Calendar,
  Clock,
  Loader2,
  FileText,
  Trophy,
  Trash2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ErrorMessage,
  Textarea,
  Skeleton
} from '@/components/ui';
import { ActivitySchema, IActivityInput } from '@/features/exam/exam.schemas';
import { FetchActivityById, UpdateActivity, DeleteActivity, FetchTopics } from '@/features/exam/exam.service';
import { FetchAcademicYears, FetchTerms, FetchTeachers } from '@/features/members/members.service';
import { toast } from 'sonner';

export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IActivityInput>({
    resolver: zodResolver(ActivitySchema),
  });

  const selectedTopic = watch('topic');
  const selectedTeacher = watch('teacher');
  const selectedYear = watch('academic_year');
  const selectedTerm = watch('term');

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      const [topicsRes, teachersRes, yearsRes, termsRes, activityRes] = await Promise.all([
        FetchTopics(),
        FetchTeachers(),
        FetchAcademicYears(),
        FetchTerms(),
        FetchActivityById(id)
      ]);

      if (topicsRes.success) setTopics(topicsRes.data.results || topicsRes.data);
      if (teachersRes.success) setTeachers(teachersRes.data.results || teachersRes.data);
      if (yearsRes.success) setAcademicYears(yearsRes.data.results || yearsRes.data);
      if (termsRes.success) setTerms(termsRes.data.results || termsRes.data);
      
      if (activityRes.success) {
        reset({
          title: activityRes.data.title,
          scenario: activityRes.data.scenario,
          task_description: activityRes.data.task_description,
          topic: activityRes.data.topic,
          teacher: activityRes.data.teacher,
          academic_year: activityRes.data.academic_year,
          term: activityRes.data.term,
          max_score: activityRes.data.max_score,
        });
      } else {
        toast.error("Failed to load activity details");
        router.push('/activity-of-intergration');
      }
      setFetchingData(false);
    };

    loadData();
  }, [id, reset, router]);

  const onSubmit = async (data: IActivityInput) => {
    setLoading(true);
    const result = await UpdateActivity({ id, data });
    
    if (result.success) {
      toast.success("Activity updated successfully");
      router.push('/activity-of-intergration');
    } else {
      toast.error(result.error?.message || "Failed to update activity");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this activity?")) {
      setLoading(true);
      const result = await DeleteActivity(id);
      if (result.success) {
        toast.success("Activity deleted successfully");
        router.push('/activity-of-intergration');
      } else {
        toast.error("Failed to delete activity");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
          <div><Skeleton className="h-80 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-gray-50"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Activity</h1>
            <p className="text-gray-500 mt-1">Update assessment task details.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="h-11 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-rose-500" />
                    Activity Title
                  </Label>
                  <Input 
                    id="title"
                    placeholder="e.g., Designing a Sustainable Home" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-rose-500 ${errors.title ? 'border-red-500' : ''}`}
                    {...register('title')}
                  />
                  {errors.title && <ErrorMessage message={errors.title.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenario" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-rose-500" />
                    Scenario (Situation)
                  </Label>
                  <Textarea 
                    id="scenario"
                    placeholder="Describe the real-life situation or problem..." 
                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-rose-500"
                    {...register('scenario')}
                  />
                  {errors.scenario && <ErrorMessage message={errors.scenario.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task_description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-rose-500" />
                    Task Description
                  </Label>
                  <Textarea 
                    id="task_description"
                    placeholder="Clearly define what the student is expected to do..." 
                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-rose-500"
                    {...register('task_description')}
                  />
                  {errors.task_description && <ErrorMessage message={errors.task_description.message} />}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-rose-500" />
                Context & Scoring
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Related Topic</Label>
                  <Select 
                    onValueChange={(val) => setValue('topic', parseInt(val))}
                    value={selectedTopic?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Topic" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name} ({t.subject_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.topic && <ErrorMessage message="Topic is required" />}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Assign Teacher</Label>
                  <Select 
                    onValueChange={(val) => setValue('teacher', val === 'none' ? null : parseInt(val))}
                    value={selectedTeacher?.toString() || 'none'}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Teacher" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="none">No specific teacher</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Year</Label>
                    <Select 
                      onValueChange={(val) => setValue('academic_year', parseInt(val))}
                      value={selectedYear?.toString()}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200 px-3">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-gray-100">
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={y.id.toString()}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Term</Label>
                    <Select 
                      onValueChange={(val) => setValue('term', parseInt(val))}
                      value={selectedTerm?.toString()}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200 px-3">
                        <SelectValue placeholder="Term" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-gray-100">
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_score" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Trophy className="w-4 h-4 mr-2 text-rose-500" />
                    Max Score
                  </Label>
                  <Input 
                    id="max_score"
                    type="number"
                    className="h-11 rounded-xl border-gray-200 focus:ring-rose-500"
                    {...register('max_score', { valueAsNumber: true })}
                  />
                  {errors.max_score && <ErrorMessage message={errors.max_score.message} />}
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl shadow-lg shadow-rose-200 font-bold bg-rose-600 hover:bg-rose-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Update Activity
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                className="w-full mt-2 h-11 rounded-xl text-gray-500"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
