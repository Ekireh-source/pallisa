'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  ClipboardCheck, 
  Calendar, 
  Clock,
  Loader2,
  CheckCircle2
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
  
} from '@/components/ui';
import { ExamSchema, IExamInput } from '@/features/exam/exam.schemas';
import { CreateExam } from '@/features/exam/exam.service';
import { FetchClasses, FetchTerms } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IExamInput>({
    resolver: zodResolver(ExamSchema),
    defaultValues: {
      name: '',
      is_published: false,
    }
  });

  const isPublished = watch('is_published');
  const selectedClass = watch('class_obj');
  const selectedTerm = watch('term');

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [classRes, termRes] = await Promise.all([
        FetchClasses(),
        FetchTerms()
      ]);

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

  const onSubmit = async (data: IExamInput) => {
    setLoading(true);
    const result = await CreateExam({ data });
    
    if (result.success) {
      toast.success("Exam scheduled successfully");
      router.push('/exams');
    } else {
      toast.error("Failed to schedule exam");
    }
    setLoading(false);
  };

  return (
    <MainLayout
      title="Schedule Exam"
      description="Create a new assessment period for your school."
      backButton={
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      headerActions={
        <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/25">
          <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center text-white">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-white font-medium">Bulk Creation Enabled</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                    <ClipboardCheck className="w-4 h-4 mr-2 text-primary" />
                    Examination Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., End of Term 1 Exams" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      Start Date
                    </Label>
                    <Input 
                      id="start_date"
                      type="date"
                      className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                      {...register('start_date')}
                    />
                    {errors.start_date && <ErrorMessage message="Start date is required" />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      End Date
                    </Label>
                    <Input 
                      id="end_date"
                      type="date"
                      className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                      {...register('end_date')}
                    />
                    {errors.end_date && <ErrorMessage message="End date is required" />}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Period & Status
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Target Class</Label>
                  <Select 
                    disabled={fetchingData}
                    onValueChange={(val) => setValue('class_obj', val === 'all' ? 'all' : parseInt(val))}
                    value={selectedClass?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="all" className="font-bold text-primary">All Classes</SelectItem>
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
                  <Label className="text-sm font-semibold text-gray-700">Term</Label>
                  <Select 
                    disabled={fetchingData}
                    onValueChange={(val) => setValue('term', parseInt(val))}
                    value={selectedTerm?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Term" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name} ({t.academic_year_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.term && <ErrorMessage message="Term is required" />}
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Publish Immediately</Label>
                    <p className="text-xs text-gray-500">Make visible to students/parents</p>
                  </div>
                  <Switch 
                    checked={isPublished}
                    onCheckedChange={(val) => setValue('is_published', val)}
                  />
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading || fetchingData}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Schedule Exam
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
    </MainLayout>
  );
}
