'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  TrendingUp,
  BookOpen,
  Users,
  Loader2,
  Percent
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
  ErrorMessage
} from '@/components/ui';
import { SaAssessmentSchema } from '@/features/exam/exam.schemas';
import { FetchSaAssessmentById, UpdateSaAssessment } from '@/features/exam/exam.service';
import { FetchAcademicYears, FetchTerms, FetchTeachers, FetchStreams, FetchSubjects } from '@/features/members/members.service';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function EditSaAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(SaAssessmentSchema)
  });

  const selectedStream = watch('stream');
  const selectedSubject = watch('subject');
  const selectedTeacher = watch('teacher');
  const selectedTerm = watch('term');
  const selectedAcademicYear = watch('academic_year');

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [streamsRes, subjectsRes, teachersRes, termsRes, yearsRes, saRes] = await Promise.all([
        FetchStreams(),
        FetchSubjects(),
        FetchTeachers(),
        FetchTerms(),
        FetchAcademicYears(),
        FetchSaAssessmentById(id)
      ]);

      if (streamsRes && 'results' in streamsRes) setStreams(streamsRes.results);
      if (subjectsRes && 'results' in subjectsRes) setSubjects(subjectsRes.results);
      if (teachersRes && 'results' in teachersRes) setTeachers(teachersRes.results);
      if (termsRes && 'results' in termsRes) setTerms(termsRes.results);
      if (yearsRes && 'results' in yearsRes) setAcademicYears(yearsRes.results);

      if (saRes.success) {
        const saData = saRes.data;
        reset({
          stream: saData.stream,
          subject: saData.subject,
          term: saData.term,
          academic_year: saData.academic_year,
          total_box: parseFloat(saData.total_box),
          teacher: saData.teacher || 'none'
        });
      } else {
        toast.error("Failed to load existing configuration");
      }

      setFetchingData(false);
    };

    loadFormData();
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);

    // Construct payload
    const payload = {
      stream: parseInt(data.stream),
      subject: parseInt(data.subject),
      term: parseInt(data.term),
      academic_year: parseInt(data.academic_year),
      total_box: parseFloat(data.total_box || 10.00),
      teacher: data.teacher && data.teacher !== 'none' ? parseInt(data.teacher) : null
    };

    const result = await UpdateSaAssessment({ id, data: payload });

    if (result.success) {
      toast.success("Summative Assessment updated successfully");
      router.push('/exams/sa-assessment');
    } else {
      toast.error(result.error?.message || "Failed to update Summative Assessment. Note: Config must be unique per Stream, Subject, Term and Year combination.");
    }
    setLoading(false);
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_GRADING}>
      <MainLayout
        title="Edit SA Configuration"
        description="Modify your Summative Assessment matrix definitions and settings."
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
              <Card className="p-8 border-none  ring-1 ring-gray-100 bg-white">
                <h3 className="font-bold text-My-Black mb-6 flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2.5 text-primary" />
                  Edit Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Stream */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Select Stream</Label>
                    <Select
                      disabled={fetchingData}
                      onValueChange={(val) => setValue('stream', parseInt(val), { shouldValidate: true })}
                      value={selectedStream?.toString()}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Stream Class" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        {streams.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.class_obj_name ? `${s.class_obj_name} - ` : ''}{s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.stream && <ErrorMessage message="Stream class is required" />}
                  </div>

                  {/* Select Subject */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Select Subject</Label>
                    <Select
                      disabled={fetchingData}
                      onValueChange={(val) => setValue('subject', parseInt(val), { shouldValidate: true })}
                      value={selectedSubject?.toString()}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id.toString()}>
                            {sub.name} ({sub.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject && <ErrorMessage message="Subject is required" />}
                  </div>

                  {/* Select Term */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Term</Label>
                    <Select
                      disabled={fetchingData}
                      onValueChange={(val) => setValue('term', parseInt(val), { shouldValidate: true })}
                      value={selectedTerm?.toString()}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        {terms.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name} {t.is_current ? '(Current Term)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.term && <ErrorMessage message="Term is required" />}
                  </div>

                  {/* Select Academic Year */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Academic Year</Label>
                    <Select
                      disabled={fetchingData}
                      onValueChange={(val) => setValue('academic_year', parseInt(val), { shouldValidate: true })}
                      value={selectedAcademicYear?.toString()}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        {academicYears.map((ay) => (
                          <SelectItem key={ay.id} value={ay.id.toString()}>
                            {ay.name} {ay.is_current ? '(Current Year)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.academic_year && <ErrorMessage message="Academic Year is required" />}
                  </div>

                  {/* Divisor Factor */}
                  <div className="space-y-2">
                    <Label htmlFor="total_box" className="text-sm font-semibold text-My-Black">Total Box Divisor</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <Input
                        id="total_box"
                        type="number"
                        step="0.01"
                        min="0.1"
                        placeholder="10.00"
                        className={`pl-10 h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.total_box ? 'border-red-500' : ''}`}
                        {...register('total_box', { valueAsNumber: true })}
                      />
                    </div>
                    {errors.total_box && <ErrorMessage message="Valid divisor factor required" />}
                  </div>

                  {/* Assigned Teacher */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Assigned Teacher</Label>
                    <Select
                      disabled={fetchingData}
                      onValueChange={(val) => setValue('teacher', val === 'none' ? null : parseInt(val))}
                      value={selectedTeacher?.toString() || 'none'}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Teacher" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        <SelectItem value="none">Auto Assign / None</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.full_name || `${t.user_profile_data?.first_name} ${t.user_profile_data?.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-gray-200 hover:bg-gray-50 font-bold"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || fetchingData}
                  className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white  -primary/20 transition-all active:scale-95 font-bold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </MainLayout>
    </ProtectedComponent>
  );
}
