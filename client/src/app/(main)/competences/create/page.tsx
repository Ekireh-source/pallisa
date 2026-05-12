'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  LayoutGrid,
  Loader2,
  FileText
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Textarea
} from '@/components/ui';
import { CompetencyAreaSchema, ICompetencyAreaInput } from '@/features/exam/exam.schemas';
import { CreateCompetencyArea } from '@/features/exam/exam.service';
import { toast } from 'sonner';

export default function CreateCompetencyAreaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ICompetencyAreaInput>({
    resolver: zodResolver(CompetencyAreaSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const onSubmit = async (data: ICompetencyAreaInput) => {
    setLoading(true);
    const result = await CreateCompetencyArea({ data });
    
    if (result.success) {
      toast.success("Competency area created successfully");
      router.push('/competences');
    } else {
      toast.error(result.error?.message || "Failed to create competency area");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <h1 className="text-3xl font-bold text-gray-900">New Competency Area</h1>
          <p className="text-gray-500 mt-1">Define a broad category for assessment activities.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                <LayoutGrid className="w-4 h-4 mr-2 text-indigo-600" />
                Area Name
              </Label>
              <Input 
                id="name"
                placeholder="e.g., Critical Thinking & Problem Solving" 
                className={`h-12 rounded-xl border-gray-200 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
                {...register('name')}
              />
              {errors.name && <ErrorMessage message={errors.name.message} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                Description (Optional)
              </Label>
              <Textarea 
                id="description"
                placeholder="Briefly describe what this competency area covers..." 
                className="min-h-[120px] rounded-xl border-gray-200 focus:ring-indigo-500"
                {...register('description')}
              />
              {errors.description && <ErrorMessage message={errors.description.message} />}
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button"
            variant="ghost" 
            className="h-12 rounded-xl px-8 text-gray-500"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="h-12 rounded-xl px-8 shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Competency Area
          </Button>
        </div>
      </form>
    </div>
  );
}
