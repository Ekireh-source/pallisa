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

      if (classRes.success) setClasses(classRes.data.results || classRes.data);
      if (termRes.success) setTerms(termRes.data.results || termRes.data);
      
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
      toast.error(result.error?.message || "Failed to schedule exam");
    }
    setLoading(false);
  };

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
            <h1 className="text-3xl font-bold text-gray-900">New Examination</h1>
            <p className="text-gray-500 mt-1">Schedule a new assessment period for the school.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                    <ClipboardCheck className="w-4 h-4 mr-2 text-amber-500" />
                    Examination Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., End of Term 1 Exams" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-amber-500 ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                      Start Date
                    </Label>
                    <Input 
                      id="start_date"
                      type="date"
                      className="h-12 rounded-xl border-gray-200 focus:ring-amber-500"
                      {...register('start_date')}
                    />
                    {errors.start_date && <ErrorMessage message="Start date is required" />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                      End Date
                    </Label>
                    <Input 
                      id="end_date"
                      type="date"
                      className="h-12 rounded-xl border-gray-200 focus:ring-amber-500"
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
                <Clock className="w-5 h-5 mr-2 text-amber-500" />
                Period & Status
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Target Class</Label>
                  <Select 
                    disabled={fetchingData}
                    onValueChange={(val) => setValue('class_obj', parseInt(val))}
                    value={selectedClass?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
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
                className="w-full h-12 rounded-xl shadow-lg shadow-amber-200 font-bold bg-amber-600 hover:bg-amber-700"
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
    </div>
  );
}
