'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  Layers,
  FileText,
  Loader2,
  ToggleLeft,
  Building2
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ClassSchema, IClassInput } from '@/features/members/members.schemas';
import { CreateClass } from '@/features/members/members.service';
import { FetchCampuses } from '@/features/school/school.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function CreateClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IClassInput>({
    resolver: zodResolver(ClassSchema),
    defaultValues: {
      name: '',
      level: undefined,
      description: '',
      is_active: true,
    }
  });

  useEffect(() => {
    const loadCampuses = async () => {
      setLoadingCampuses(true);
      const result = await FetchCampuses();
      if (result.success) {
        setCampuses(result.data.results || result.data);
      } else {
        toast.error("Failed to load campuses");
      }
      setLoadingCampuses(false);
    };
    loadCampuses();
  }, []);

  const isActive = watch('is_active');
  const selectedCampus = watch('campus');
  const selectedLevel = watch('level') || undefined;

  const onSubmit: SubmitHandler<IClassInput> = async (data) => {
    setLoading(true);
    const result = await CreateClass(data);

    if (result.success) {
      toast.success("Class added successfully");
      router.push('/classes');
    } else {
      toast.error("Failed to add class");
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
            <h1 className="text-3xl font-bold text-gray-900">Add Class</h1>
            <p className="text-gray-500 mt-1">Define a new grade level for the school.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-blue-500" />
                      Class Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., S1, S2, S3"
                      className={`h-12 rounded-xl border-gray-200 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                      {...register('name')}
                    />
                    {errors.name && <ErrorMessage message={errors.name.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-blue-500" />
                      Level
                    </Label>
                    <Select
                      onValueChange={(val) => setValue('level', val)}
                      value={selectedLevel}
                    >
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-blue-500 ${errors.level ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-gray-100">
                        <SelectItem value="0level">O-Level</SelectItem>
                        <SelectItem value="Alevel">A-Level</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.level && <ErrorMessage message={errors.level.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campus" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-blue-500" />
                      Campus
                    </Label>
                    <Select
                      onValueChange={(val) => setValue('campus', parseInt(val))}
                      value={selectedCampus?.toString()}
                    >
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-blue-500 ${errors.campus ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-gray-100">
                        {loadingCampuses ? (
                          <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                        ) : campuses.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">No campuses found</div>
                        ) : (
                          campuses.map((campus) => (
                            <SelectItem key={campus.id} value={campus.id.toString()}>
                              {campus.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.campus && <ErrorMessage message={errors.campus.message} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this grade level..."
                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-blue-500"
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
                <ToggleLeft className="w-5 h-5 mr-2 text-blue-500" />
                Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">Class is available for enrollment</p>
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
                className="w-full h-12 rounded-xl font-bold bg-primary "
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Class
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
