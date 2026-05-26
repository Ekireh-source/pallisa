'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { selectSchool } from '@/store/auth/selectors';
import {
  ChevronLeft,
  Save,
  CalendarDays,
  Clock,
  Loader2,
  ToggleLeft
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { AcademicYearSchema, IAcademicYearInput } from '@/features/members/members.schemas';
import { CreateAcademicYear } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';

export default function CreateAcademicYearPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const school = useSelector(selectSchool);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IAcademicYearInput>({
    resolver: zodResolver(AcademicYearSchema),
    defaultValues: {
      name: '',
      is_current: false,
      is_active: true,
      school: school?.id || undefined,
    }
  });

  useEffect(() => {
    if (school?.id) {
      setValue('school', school.id);
    }
  }, [school?.id, setValue]);

  const isActive = watch('is_active');
  const isCurrent = watch('is_current');

  const onSubmit = async (data: IAcademicYearInput) => {
    setLoading(true);
    const result = await CreateAcademicYear(data);

    if (result.success) {
      toast.success("Academic year created successfully");
      router.push('/academic-years');
    } else {
      toast.error("Failed to create academic year");
    }
    setLoading(false);
  };

  return (
    <MainLayout
      title="New Academic Year"
      description="Initialize a new academic cycle for the school."
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
      <div className="w-full space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('school', { valueAsNumber: true })} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
                <div className="space-y-6">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                      Year Name
                    </Label>
                    <Select 
                      onValueChange={(val) => setValue('name', val)}
                      value={watch('name')}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 focus:ring-primary w-full">
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-gray-100">
                        {Array.from({ length: 12 }, (_, i) => {
                          const year = 2024 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.name && <ErrorMessage message={errors.name.message} />}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
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
                        <Clock className="w-4 h-4 mr-2 text-primary" />
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
                  <ToggleLeft className="w-5 h-5 mr-2 text-primary" />
                  Cycle Settings
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-gray-900">Set as Current</Label>
                      <p className="text-xs text-gray-500">Currently active academic cycle</p>
                    </div>
                    <Switch
                      checked={isCurrent}
                      onCheckedChange={(val: boolean) => setValue('is_current', val)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                      <p className="text-xs text-gray-500">Year is visible and selectable</p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(val: boolean) => setValue('is_active', val)}
                    />
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
                  Create Year
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
