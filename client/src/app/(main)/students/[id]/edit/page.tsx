'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  User,
  GraduationCap,
  Loader2,
  ToggleLeft,
  Mail,
  Calendar,
  Layers,
  Info,
  Trash2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Skeleton,
 
} from '@/components/ui';
import { StudentSchema, IStudentInput } from '@/features/members/members.schemas';
import { FetchStudentById, UpdateStudent, DeleteStudent, FetchStreams } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [streams, setStreams] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IStudentInput>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      user_first_name: '',
      user_last_name: '',
      user_gender: 'M',
      student_id: '',
      enrollment_status: 'enrolled',
      is_active: true,
    }
  });

  const isActive = watch('is_active');

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      const [studentRes, streamsRes] = await Promise.all([
        FetchStudentById(id),
        FetchStreams()
      ]);

      if (streamsRes.success) setStreams(streamsRes.data.results || streamsRes.data);

      if (studentRes.success) {
        const student = studentRes.data;
        reset({
          user_email: student.user_email,
          student_id: student.student_id,
          user_first_name: student.user_profile_data?.first_name || student.student_name?.split(' ')[0] || '',
          user_last_name: student.user_profile_data?.last_name || student.student_name?.split(' ')[1] || '',
          user_gender: student.user_profile_data?.gender || 'M',
          current_stream: student.current_stream,
          enrollment_status: student.enrollment_status,
          admission_date: student.admission_date,
          is_active: student.is_active,
        });
      } else {
        toast.error("Failed to load student details");
        router.push('/students');
      }
      setInitialLoading(false);
    };
    loadData();
  }, [id, reset, router]);

  const onSubmit = async (data: IStudentInput) => {
    setLoading(true);
    const result = await UpdateStudent(id, data);
    
    if (result.success) {
      toast.success("Student updated successfully");
      router.push('/students');
    } else {
      toast.error("Failed to update student");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      setLoading(true);
      const result = await DeleteStudent(id);
      if (result.success) {
        toast.success("Student record deleted");
        router.push('/students');
      } else {
        toast.error("Failed to delete student");
      }
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
            <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-500 mt-1">Update profile and enrollment details.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Record
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="user_first_name">First Name</Label>
                  <Input 
                    id="user_first_name"
                    placeholder="Enter first name" 
                    className="h-12 rounded-xl border-gray-200"
                    {...register('user_first_name')}
                  />
                  {errors.user_first_name && <ErrorMessage message={errors.user_first_name.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_last_name">Last Name</Label>
                  <Input 
                    id="user_last_name"
                    placeholder="Enter last name" 
                    className="h-12 rounded-xl border-gray-200"
                    {...register('user_last_name')}
                  />
                  {errors.user_last_name && <ErrorMessage message={errors.user_last_name.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="user_email"
                      type="email"
                      placeholder="student@example.com" 
                      className="h-12 pl-10 rounded-xl border-gray-200"
                      {...register('user_email')}
                    />
                  </div>
                  {errors.user_email && <ErrorMessage message={errors.user_email.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_gender">Gender</Label>
                  <select
                    id="user_gender"
                    className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('user_gender')}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                Academic Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID / Reg No</Label>
                  <Input 
                    id="student_id"
                    placeholder="e.g., STU-2024-001" 
                    className="h-12 rounded-xl border-gray-200"
                    {...register('student_id')}
                  />
                  {errors.student_id && <ErrorMessage message={errors.student_id.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_stream">Assigned Stream</Label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="current_stream"
                      className="flex h-12 w-full pl-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      {...register('current_stream', { valueAsNumber: true })}
                    >
                      <option value="">Select a stream</option>
                      {streams.map((stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.class_obj_name} - {stream.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="admission_date"
                      type="date"
                      className="h-12 pl-10 rounded-xl border-gray-200"
                      {...register('admission_date')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollment_status">Enrollment Status</Label>
                  <select
                    id="enrollment_status"
                    className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('enrollment_status')}
                  >
                    <option value="enrolled">Enrolled</option>
                    <option value="transferred">Transferred</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-indigo-500" />
                Settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">Student is currently in school</p>
                  </div>
                  <Switch 
                    checked={isActive}
                    onCheckedChange={(val) => setValue('is_active', val)}
                  />
                </div>
              </div>
            </Card>

            <div className="pt-2 space-y-3">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
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
                className="w-full h-11 rounded-xl text-gray-500"
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
