'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  Clock,
  CalendarDays,
  Loader2,
  ToggleLeft,
  Trash2
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
  Skeleton
} from '@/components/ui';
import { TermSchema, ITermInput } from '@/features/members/members.schemas';
import { FetchTermById, UpdateTerm, DeleteTerm, FetchAcademicYears } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';

export default function EditTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ITermInput>({
    resolver: zodResolver(TermSchema),
  });

  const isActive = watch('is_active');
  const isCurrent = watch('is_current');
  const selectedYear = watch('academic_year');

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      const [yearsRes, termRes] = await Promise.all([
        FetchAcademicYears(),
        FetchTermById(id)
      ]);

      if (yearsRes && 'results' in yearsRes) {
        setAcademicYears(yearsRes.results);
      }

      if (termRes.success) {
        reset({
          name: termRes.data.name,
          academic_year: termRes.data.academic_year,
          start_date: termRes.data.start_date,
          end_date: termRes.data.end_date,
          is_current: termRes.data.is_current,
          is_active: termRes.data.is_active,
        });
      } else {
        toast.error("Failed to load term details");
        router.push('/terms');
      }
      setFetchingData(false);
    };
    loadData();
  }, [id, reset, router]);

  const onSubmit = async (data: ITermInput) => {
    setLoading(true);
    const result = await UpdateTerm(id, data);

    if (result.success) {
      toast.success("Term updated successfully");
      router.push('/terms');
    } else {
      toast.error("Failed to update term");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this term?")) {
      setLoading(true);
      const result = await DeleteTerm(id);
      if (result.success) {
        toast.success("Term deleted successfully");
        router.push('/terms');
      } else {
        toast.error("Failed to delete term");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <MainLayout
        title="Edit Term"
        description="Update academic term details."
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
        <div className="w-full space-y-8 animate-in fade-in duration-500 mt-[24px]">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2"><Skeleton className="h-64 w-full rounded-xl" /></div>
            <div><Skeleton className="h-64 w-full rounded-xl" /></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Edit Term"
      description="Update academic term details."
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
          className="h-11 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 bg-white w-full sm:w-auto font-bold px-4 "
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      }
    >
      <div className="w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8 border-none  ring-1 ring-gray-100">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-My-Black flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      Term Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Term 1 or Semester 1"
                      className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                      {...register('name')}
                    />
                    {errors.name && <ErrorMessage message={errors.name.message} />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-sm font-semibold text-My-Black flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
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
                      <Label htmlFor="end_date" className="text-sm font-semibold text-My-Black flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2 text-primary" />
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
              <Card className="p-6 border-none  ring-1 ring-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-My-Black mb-6 flex items-center">
                  <ToggleLeft className="w-5 h-5 mr-2 text-primary" />
                  Settings
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-My-Black">Academic Year</Label>
                    <Select
                      onValueChange={(val) => setValue('academic_year', parseInt(val))}
                      value={selectedYear?.toString()}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl -xl border-gray-100">
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={y.id.toString()}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.academic_year && <ErrorMessage message={errors.academic_year.message} />}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 ">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-My-Black">Set as Current</Label>
                      <p className="text-xs text-gray-500">Currently active term</p>
                    </div>
                    <Switch
                      checked={isCurrent}
                      onCheckedChange={(val) => setValue('is_current', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 ">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-My-Black">Active Status</Label>
                      <p className="text-xs text-gray-500">Term is visible and selectable</p>
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
                  className="w-full h-12 rounded-xl font-bold bg-primary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Update Term
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
