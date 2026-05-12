'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
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
  Skeleton
} from '@/components/ui';
import { Switch } from '@/components/ui/switch';
import { CampusSchema, ICampusInput } from '@/features/school/school.schemas';
import api from "@/lib/api";
import { UpdateCampus, DeleteCampus } from '@/features/school/school.service';
import { toast } from 'sonner';

export default function EditCampusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ICampusInput>({
    resolver: zodResolver(CampusSchema),
  });

  const isActive = watch('active');

  useEffect(() => {
    const loadCampus = async () => {
      setFetchingData(true);
      try {
        const res = await api.get(`/schools/campuses/${id}/`);
        if (res.data) {
          reset({
            name: res.data.name,
            email: res.data.email,
            phone_number: res.data.phone_number,
            address: res.data.address,
            active: res.data.active,
          });
        }
      } catch (error) {
        toast.error("Failed to load campus details");
        router.push('/campuses');
      }
      setFetchingData(false);
    };

    loadCampus();
  }, [id, reset, router]);

  const onSubmit: SubmitHandler<ICampusInput> = async (data) => {
    setLoading(true);
    const result = await UpdateCampus({ id, data });
    
    if (result.success) {
      toast.success("Campus updated successfully");
      router.push('/campuses');
    } else {
      toast.error("Failed to update campus");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this campus?")) {
      setLoading(true);
      const result = await DeleteCampus(id);
      if (result.success) {
        toast.success("Campus deleted successfully");
        router.push('/campuses');
      } else {
        toast.error("Failed to delete campus");
      }
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Campus</h1>
            <p className="text-gray-500 mt-1">Update registration details for this campus.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="h-11 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-indigo-500" />
                    Campus Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Main Campus" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-indigo-500" />
                      Email Address
                    </Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="campus@example.com" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
                      {...register('email')}
                    />
                    {errors.email && <ErrorMessage message={errors.email.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-indigo-500" />
                      Phone Number
                    </Label>
                    <Input 
                      id="phone_number"
                      placeholder="+256 ..." 
                      className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
                      {...register('phone_number')}
                    />
                    {errors.phone_number && <ErrorMessage message={errors.phone_number.message} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                    Physical Address
                  </Label>
                  <Input 
                    id="address"
                    placeholder="Plot 12, High Street" 
                    className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
                    {...register('address')}
                  />
                  {errors.address && <ErrorMessage message={errors.address.message} />}
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
                    <p className="text-xs text-gray-500">Campus is active and selectable</p>
                  </div>
                  <Switch 
                    checked={isActive}
                    onCheckedChange={(val) => setValue('active', val)}
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
                Update Campus
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
