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
import { FetchActivityById, UpdateActivity, DeleteActivity, FetchTopics, FetchCompetencyAreas } from '@/features/exam/exam.service';
import { FetchAcademicYears, FetchTerms, FetchTeachers } from '@/features/members/members.service';
import { toast } from 'sonner';
import { ITeacher } from '@/features/members/members.schemas';


export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [competencyAreas, setCompetencyAreas] = useState<any[]>([]);

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
  const selectedTerm = watch('term');
  const selectedCompetencyArea = watch('competency_area');

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      const [topicsRes, teachersRes, termsRes, activityRes, areasRes] = await Promise.all([
        FetchTopics(),
        FetchTeachers(),
        FetchTerms(),
        FetchActivityById(id),
        FetchCompetencyAreas()
      ]);

      if (topicsRes && 'results' in topicsRes) {
        setTopics(topicsRes.results);
      }
      if (teachersRes && 'results' in teachersRes) {
        setTeachers(teachersRes.results);
      }
      if (termsRes && 'results' in termsRes) {
        setTerms(termsRes.results);
      }
      if (areasRes && 'results' in areasRes) {
        setCompetencyAreas(areasRes.results);
      }
      
      if (activityRes.success) {
        reset({
          topic: activityRes.data.topic,
          teacher: activityRes.data.teacher,
          term: activityRes.data.term,
          max_score: activityRes.data.max_score,
          competency_area: activityRes.data.competency_area,
        });
      } else {
        toast.error("Failed to load activity details");
        router.push('/activity-of-integration');
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
      router.push('/activity-of-integration');
    } else {
      toast.error("Failed to update activity");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this activity?")) {
      setLoading(true);
      const result = await DeleteActivity(id);
      if (result.success) {
        toast.success("Activity deleted successfully");
        router.push('/activity-of-integration');
      } else {
        toast.error("Failed to delete activity");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
            <BookOpen className="w-5 h-5 mr-2 text-primary" />
            Activity Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Related Topic</Label>
              <Select 
                onValueChange={(val) => setValue('topic', parseInt(val), { shouldValidate: true })}
                value={selectedTopic?.toString()}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
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
              <Label className="text-sm font-semibold text-gray-700">Term</Label>
              <Select 
                onValueChange={(val) => setValue('term', parseInt(val), { shouldValidate: true })}
                value={selectedTerm?.toString()}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-gray-100">
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.term && <ErrorMessage message="Term is required" />}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Competency Area</Label>
              <Select 
                onValueChange={(val) => setValue('competency_area', val === 'none' ? undefined : parseInt(val))}
                value={selectedCompetencyArea?.toString() || 'none'}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                  <SelectValue placeholder="Select Competency Area" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-gray-100">
                  <SelectItem value="none">None</SelectItem>
                  {competencyAreas.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Assigned Teacher</Label>
              <Select 
                onValueChange={(val) => setValue('teacher', val === 'none' ? undefined : parseInt(val))}
                value={selectedTeacher?.toString() || 'none'}
              >
                <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-gray-100">
                  <SelectItem value="none">None</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score" className="text-sm font-semibold text-gray-700">Max Score</Label>
              <Input 
                id="max_score"
                type="number"
                placeholder="10" 
                className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.max_score ? 'border-red-500' : ''}`}
                {...register('max_score', { valueAsNumber: true })}
              />
              {errors.max_score && <ErrorMessage message="Valid score required" />}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="h-12 px-8 rounded-xl border-gray-200"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {loading ? "Updating..." : "Update Activity"}
          </Button>
        </div>
      </form>
    </div>
  );
}
