'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  Layers,
  Users,
  Loader2,
  ToggleLeft,
  School,
  Trash2
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { StreamSchema, IStreamInput } from '@/features/members/members.schemas';
import { FetchStreamById, UpdateStream, DeleteStream, FetchClasses, FetchTeachers } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { AddTeacherModal } from '@/components/modals/add-teacher-modal';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function EditStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IStreamInput>({
    resolver: zodResolver(StreamSchema),
    defaultValues: {
      name: '',
      class_obj: 0,
      capacity: 40,
      is_active: true,
    }
  });

  const isActive = watch('is_active');

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      const [streamRes, classesRes, teachersRes] = await Promise.all([
        FetchStreamById(id),
        FetchClasses(),
        FetchTeachers()
      ]);

      if (classesRes && 'results' in classesRes) {
        setClasses(classesRes.results);
      }
      if (teachersRes && 'results' in teachersRes) {
        setTeachers(teachersRes.results);
      }

      if (streamRes.success) {
        reset({
          name: streamRes.data.name,
          class_obj: streamRes.data.class_obj,
          capacity: streamRes.data.capacity,
          class_teacher: streamRes.data.class_teacher,
          is_active: streamRes.data.is_active,
        });
      } else {
        toast.error("Failed to load stream details");
        router.push('/streams');
      }
      setInitialLoading(false);
    };
    loadData();
  }, [id, reset, router]);

  const onSubmit = async (data: IStreamInput) => {
    setLoading(true);
    const result = await UpdateStream(id, data);

    if (result.success) {
      toast.success("Stream updated successfully");
      router.push('/streams');
    } else {
      toast.error("Failed to update stream");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this stream?")) {
      setLoading(true);
      const result = await DeleteStream(id);
      if (result.success) {
        toast.success("Stream deleted successfully");
        router.push('/streams');
      } else {
        toast.error("Failed to delete stream");
      }
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full px-4 md:px-0 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="p-8"><Skeleton className="h-96 w-full" /></Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_STREAMS}>
      <MainLayout
        title="Edit Stream"
        description="Modify stream details and assignments."
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
            variant="outline"
            className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl bg-white w-full sm:w-auto h-11"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Stream
          </Button>
        }
      >
        <div className="w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Card className="p-8 border-none  ring-1 ring-gray-100">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-My-Black flex items-center">
                        <Layers className="w-4 h-4 mr-2 text-primary" />
                        Stream Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Stream A, North Stream"
                        className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                        {...register('name')}
                      />
                      {errors.name && <ErrorMessage message={errors.name.message} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="class_obj" className="text-sm font-semibold text-My-Black flex items-center">
                          <School className="w-4 h-4 mr-2 text-primary" />
                          Class
                        </Label>
                        <Select
                          onValueChange={(val) => setValue('class_obj', parseInt(val))}
                          value={watch('class_obj') ? watch('class_obj').toString() : ''}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 focus:ring-primary w-full text-left">
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl -xl border-gray-100">
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}{cls.level ? ` (${cls.level === '0level' ? 'O-Level' : 'A-Level'})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.class_obj && <ErrorMessage message={errors.class_obj.message} />}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity" className="text-sm font-semibold text-My-Black flex items-center">
                          <Users className="w-4 h-4 mr-2 text-primary" />
                          Capacity
                        </Label>
                        <Input
                          id="capacity"
                          type="number"
                          className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                          {...register('capacity', { valueAsNumber: true })}
                        />
                        {errors.capacity && <ErrorMessage message={errors.capacity.message} />}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class_teacher" className="text-sm font-semibold text-My-Black flex items-center">
                        <Users className="w-4 h-4 mr-2 text-primary" />
                        Class Teacher (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            onValueChange={(val) => {
                              if (val === 'none' || !val) {
                                setValue('class_teacher', undefined);
                              } else {
                                setValue('class_teacher', parseInt(val));
                              }
                            }}
                            value={watch('class_teacher') ? watch('class_teacher')?.toString() : 'none'}
                          >
                            <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 focus:ring-primary w-full text-left">
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl -xl border-gray-100">
                              <SelectItem value="none">Select a teacher</SelectItem>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.teacher_name || `${teacher.user_profile_data?.first_name} ${teacher.user_profile_data?.last_name}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <AddTeacherModal
                          onTeacherAdded={(newTeacher) => {
                            setTeachers((prev) => [...prev, newTeacher]);
                            setValue('class_teacher', newTeacher.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-none  ring-1 ring-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-My-Black mb-6 flex items-center">
                    <ToggleLeft className="w-5 h-5 mr-2 text-primary" />
                    Stream Status
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 ">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-My-Black">Active Status</Label>
                        <p className="text-xs text-gray-500">Enable or disable this stream</p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(val) => setValue('is_active', val)}
                      />
                    </div>
                  </div>
                </Card>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl  -primary/20 font-bold bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Save Changes
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
    </ProtectedComponent>
  );
}
