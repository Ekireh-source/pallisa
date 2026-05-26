'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  BookOpen, 
  Layers, 
  FileText,
  Loader2,
  Trash2
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
  ErrorMessage,
  Skeleton
} from '@/components/ui';
import { TopicSchema, ITopicInput } from '@/features/exam/exam.schemas';
import { FetchTopicById, UpdateTopic, DeleteTopic } from '@/features/exam/exam.service';
import { FetchClasses, FetchSubjects } from '@/features/members/members.service';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';

export default function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
    reset,
    formState: { errors },
  } = useForm<ITopicInput>({
    resolver: zodResolver(TopicSchema),
  });

  const selectedClass = watch('class_obj');
  const selectedSubject = watch('subject');

  useEffect(() => {
    const loadFormData = async () => {
      setFetchingData(true);
      const [classRes, subjectRes, topicRes] = await Promise.all([
        FetchClasses(),
        FetchSubjects(),
        FetchTopicById(id)
      ]);

      if (classRes && 'results' in classRes) {
        setClasses(classRes.results);
      }
      if (subjectRes && 'results' in subjectRes) {
        setSubjects(subjectRes.results);
      }
      
      if (topicRes.success) {
        reset({
          name: topicRes.data.name,
          description: topicRes.data.description,
          class_obj: topicRes.data.class_obj,
          subject: topicRes.data.subject,
        });
      } else {
        toast.error("Failed to load topic details");
        router.push('/topics');
      }
      
      setFetchingData(false);
    };

    loadFormData();
  }, [id, reset, router]);

  const onSubmit = async (data: ITopicInput) => {
    setLoading(true);
    const result = await UpdateTopic({ id: parseInt(id), data });
    
    if (result.success) {
      toast.success("Topic updated successfully");
      router.push('/topics');
    } else {
      toast.error("Failed to update topic");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this topic?")) {
      setLoading(true);
      const result = await DeleteTopic(parseInt(id));
      if (result.success) {
        toast.success("Topic deleted successfully");
        router.push('/topics');
      } else {
        toast.error("Failed to delete topic");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
          <div><Skeleton className="h-64 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      title="Edit Topic"
      description="Update the details for this competency."
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
      headerActions={
        <Button 
          className="h-11 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 bg-white font-bold border-transparent"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      }
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

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
                    onValueChange={(val) => setValue('subject', parseInt(val))}
                    value={selectedSubject?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Subject" />
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
                    onValueChange={(val) => setValue('class_obj', parseInt(val))}
                    value={selectedClass?.toString()}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Class" />
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Update Topic
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
    </MainLayout>
  );
}
