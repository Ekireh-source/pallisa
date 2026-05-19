'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  BookOpen, 
  Layers, 
  FileText,
  Loader2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ErrorMessage
} from '@/components/ui';
import { TopicSchema, ITopicInput } from '@/features/exam/exam.schemas';
import { CreateTopic } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import { FetchClasses, FetchSubjects } from '@/features/members/members.service';

export default function CreateTopicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ITopicInput>({
    resolver: zodResolver(TopicSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const selectedClass = watch('class_obj');
  const selectedSubject = watch('subject');

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [classRes, subjectRes] = await Promise.all([
        FetchClasses(),
        FetchSubjects()
      ]);

      if (classRes && 'results' in classRes) {
        setClasses(classRes.results);
      }
      if (subjectRes && 'results' in subjectRes) {
        setSubjects(subjectRes.results);
      }
      
      setFetchingData(false);
    };

    loadFormData();
  }, []);

  const onSubmit = async (data: ITopicInput) => {
    setLoading(true);
    const result = await CreateTopic({ data });
    
    if (result.success) {
      toast.success("Topic created successfully");
      router.push('/topics');
    } else {
      toast.error("Failed to create topic");
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
            <h1 className="text-3xl font-bold text-gray-900">New Topic</h1>
            <p className="text-gray-500 mt-1">Define a new competency for the curriculum.</p>
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
                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                    Topic Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Understanding Cellular Respiration" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary" />
                    Description
                  </Label>
                  <Textarea 
                    id="description"
                    placeholder="Provide a detailed description of the learning outcome..." 
                    className="min-h-[150px] rounded-xl border-gray-200 focus:ring-primary resize-none"
                    {...register('description')}
                  />
                  {errors.description && <ErrorMessage message={errors.description.message} />}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-primary" />
                Classification
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Subject</Label>
                  <Select 
                    disabled={fetchingData}
                    onValueChange={(val) => setValue('subject', parseInt(val))}
                    value={selectedSubject?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder={fetchingData ? "Loading..." : "Select Subject"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>
                          {sub.name} ({sub.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && <ErrorMessage message="Subject is required" />}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Class Level</Label>
                  <Select 
                    disabled={fetchingData}
                    onValueChange={(val) => setValue('class_obj', parseInt(val))}
                    value={selectedClass?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder={fetchingData ? "Loading..." : "Select Class"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class_obj && <ErrorMessage message="Class is required" />}
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary text-white"
                disabled={loading || fetchingData}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Topic
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
