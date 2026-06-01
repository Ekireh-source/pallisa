'use client';

import React, { useEffect, useState } from 'react';
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
  Trophy
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
  Textarea
} from '@/components/ui';
import { ActivitySchema, IActivityInput } from '@/features/exam/exam.schemas';
import { CreateActivity, FetchTopics, FetchCompetencyAreas } from '@/features/exam/exam.service';
import { FetchAcademicYears, FetchTerms, FetchTeachers } from '@/features/members/members.service';
import { toast } from 'sonner';
import { ITeacher } from '@/features/members/members.schemas';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';


export default function CreateActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [competencyAreas, setCompetencyAreas] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IActivityInput>({
    resolver: zodResolver(ActivitySchema),
    defaultValues: {
      max_score: 10,
    }
  });

  const selectedTopic = watch('topic');
  const selectedCompetencyArea = watch('competency_area');
  const selectedTeacher = watch('teacher');
  const selectedTerm = watch('term');

  // Filtered competency areas are now managed directly by the backend!
  const displayedCompetencyAreas = competencyAreas;

  // Fetch competency areas from the backend whenever the selected topic changes
  useEffect(() => {
    const loadCompetencyAreas = async () => {
      setFetchingData(true);
      try {
        const queryParams = selectedTopic ? { topic_id: selectedTopic } : undefined;
        const res = await FetchCompetencyAreas(queryParams);
        if (res && 'results' in res) {
          setCompetencyAreas(res.results);
          
          if (selectedTopic) {
            // Automatically select competency area when topic is selected, if there's only one matching
            if (res.results.length === 1) {
              setValue('competency_area', res.results[0].id);
            } else {
              // Clear current selection if it doesn't match the new list
              const currentArea = res.results.find(a => a.id === selectedCompetencyArea);
              if (!currentArea) {
                setValue('competency_area', undefined);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load competency areas:", err);
      } finally {
        setFetchingData(false);
      }
    };

    loadCompetencyAreas();
  }, [selectedTopic, setValue]);

  // Automatically fill topic when competency area is selected
  useEffect(() => {
    if (selectedCompetencyArea && selectedCompetencyArea.toString() !== 'none') {
      const area = competencyAreas.find(a => a.id === parseInt(selectedCompetencyArea.toString()));
      if (area && area.topic && selectedTopic !== area.topic) {
        setValue('topic', area.topic, { shouldValidate: true });
      }
    }
  }, [selectedCompetencyArea, competencyAreas, selectedTopic, setValue]);

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [topicsRes, teachersRes, termsRes] = await Promise.all([
        FetchTopics(),
        FetchTeachers(),
        FetchTerms()
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
      
      setFetchingData(false);
    };

    loadFormData();
  }, []);

  const onSubmit = async (data: IActivityInput) => {
    setLoading(true);
    const result = await CreateActivity({ data });
    
    if (result.success) {
      toast.success("Activity created successfully");
      router.push('/activity-of-integration');
    } else {
      toast.error("Failed to create activity");
    }
    setLoading(false);
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_GRADING}>
    <MainLayout
      title="New Activity of Integration"
      description="Design a major assessment task for student competency evaluation."
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
        <div className="w-full space-y-6">
          {/* Main Options Area */}
          <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              Activity Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Related Topic</Label>
                <Select 
                  disabled={fetchingData}
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
                  disabled={fetchingData}
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
                  disabled={fetchingData}
                  onValueChange={(val) => setValue('competency_area', parseInt(val))}
                  value={selectedCompetencyArea?.toString()}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                    <SelectValue placeholder="Select Competency Area" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-gray-100">
                    <SelectItem value="none">None</SelectItem>
                    {displayedCompetencyAreas.map((a) => (
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
                  disabled={fetchingData}
                  onValueChange={(val) => setValue('teacher', parseInt(val))}
                  value={selectedTeacher?.toString()}
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
              disabled={loading || fetchingData}
              className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? "Creating..." : "Create Activity"}
            </Button>
          </div>
        </div>
      </form>
      </div>
    </MainLayout>
    </ProtectedComponent>
  );
}
