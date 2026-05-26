'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { 
  ChevronLeft, 
  Save, 
  BookMarked, 
  Hash, 
  FileText,
  Loader2,
  ToggleLeft,
  Trash2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Textarea,
  Skeleton
} from '@/components/ui';
import { 
  SubjectSchema, 
  ISubjectInput
} from '@/features/members/members.schemas';
import { 
  FetchSubjectById, 
  UpdateSubject, 
  DeleteSubject
} from '@/features/members/members.service';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/store';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const { school } = useSelector((state: RootState) => state.auth);

  // Form for Subject
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ISubjectInput>({
    resolver: zodResolver(SubjectSchema),
  });

  const isActive = watch('is_active');

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      const result = await FetchSubjectById(id);
      if (result.success) {
        reset({
          name: result.data.name,
          code: result.data.code,
          description: result.data.description || '',
          is_active: result.data.is_active,
          school: result.data.school,
        });
      } else {
        toast.error("Failed to load subject details");
        router.push('/subjects');
      }
      setFetchingData(false);
    };
    loadData();
  }, [id, reset, router]);

  // Main Subject Submit Handler
  const onSubmit = async (data: ISubjectInput) => {
    if (!school?.id) {
      toast.error("School information missing.");
      return;
    }

    setLoading(true);
    const result = await UpdateSubject(id, {
      ...data,
      school: school.id
    });
    
    if (result.success) {
      toast.success("Subject updated successfully");
      router.push(`/subjects/${id}`);
    } else {
      toast.error("Failed to update subject");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this subject?")) {
      setLoading(true);
      const result = await DeleteSubject(id);
      if (result.success) {
        toast.success("Subject deleted successfully");
        router.push('/subjects');
      } else {
        toast.error("Failed to delete subject");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="w-full px-4 md:px-0 space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><Skeleton className="h-64 w-full rounded-xl" /></div>
          <div><Skeleton className="h-48 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_SUBJECTS}>
    <MainLayout
      title="Edit Subject"
      description="Update course details and settings."
      backButton={
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
          onClick={() => router.push(`/subjects/${id}`)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      headerActions={
        <Button 
          className="h-11 rounded-xl text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border-transparent font-bold w-full sm:w-auto"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      }
    >
      <div className="w-full px-4 md:px-0 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <BookMarked className="w-4 h-4 mr-2 text-emerald-500" />
                      Subject Name
                    </Label>
                    <Input 
                      id="name"
                      placeholder="e.g., Mathematics" 
                      className={`h-12 rounded-xl border-gray-200 focus:ring-emerald-500 ${errors.name ? 'border-red-500' : ''}`}
                      {...register('name')}
                    />
                    {errors.name && <ErrorMessage message={errors.name.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-emerald-500" />
                      Subject Code
                    </Label>
                    <Input 
                      id="code"
                      placeholder="e.g., MATH101" 
                      className={`h-12 rounded-xl border-gray-200 focus:ring-emerald-500 ${errors.code ? 'border-red-500' : ''}`}
                      {...register('code')}
                    />
                    {errors.code && <ErrorMessage message={errors.code.message} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                    Description (Optional)
                  </Label>
                  <Textarea 
                    id="description"
                    placeholder="Brief overview of the subject curriculum..." 
                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-emerald-500"
                    {...register('description')}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <ToggleLeft className="w-5 h-5 mr-2 text-emerald-500" />
                Settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">Subject is available for selection</p>
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
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Update Subject
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                className="w-full mt-2 h-11 rounded-xl text-gray-500"
                onClick={() => router.push(`/subjects/${id}`)}
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
