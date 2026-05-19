'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  BookMarked, 
  Hash, 
  FileText,
  Loader2,
  ToggleLeft
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Textarea
} from '@/components/ui';
import { SubjectSchema, ISubjectInput } from '@/features/members/members.schemas';
import { CreateSubject } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function CreateSubjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { school } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ISubjectInput>({
    resolver: zodResolver(SubjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
    }
  });

  const isActive = watch('is_active');

  const onSubmit = async (data: ISubjectInput) => {
    if (!school?.id) {
      toast.error("School information missing. Please try logging in again.");
      return;
    }

    setLoading(true);
    const result = await CreateSubject({
      ...data,
      school: school.id
    });
    
    if (result.success) {
      toast.success("Subject added successfully");
      router.push('/subjects');
    } else {
      toast.error("Failed to add subject");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-gray-50 shrink-0"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Subject</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Define a new course for the school curriculum.</p>
          </div>
        </div>
      </div>

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
                Save Subject
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
