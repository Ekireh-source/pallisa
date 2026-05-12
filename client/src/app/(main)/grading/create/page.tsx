'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ChevronLeft, 
  Save, 
  Layers,
  Loader2,
  ToggleLeft
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
} from '@/components/ui';
import { CreateGradingSystem } from '@/features/reports/reports.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useAppSelector } from '@/store';

export default function CreateGradingSystemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { school } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  const isActive = watch('is_active');

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await CreateGradingSystem({ ...data, school: school?.id });
    
    if (result.success) {
      toast.success("Grading system created successfully");
      router.push(`/grading/${result.data.id}/edit`);
    } else {
      toast.error("Failed to create grading system");
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
            <h1 className="text-3xl font-bold text-gray-900">New Grading System</h1>
            <p className="text-gray-500 mt-1">Initialize a new grading scale (e.g. O Level Grades).</p>
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
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                    System Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., O Level Grades" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name', { required: 'System name is required' })}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message as string} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                    Description (Optional)
                  </Label>
                  <Input 
                    id="description"
                    placeholder="e.g., Used for S.1 to S.4" 
                    className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
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
                <ToggleLeft className="w-5 h-5 mr-2 text-indigo-500" />
                Settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">System is active</p>
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
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save & Add Grades
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
