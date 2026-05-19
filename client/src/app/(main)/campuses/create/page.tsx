'use client';

import React, { useState } from 'react';
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
  ToggleLeft
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage
} from '@/components/ui';
import { Switch } from '@/components/ui/switch';
import { CampusSchema, ICampusInput } from '@/features/school/school.schemas';
import { CreateCampus } from '@/features/school/school.service';
import { toast } from 'sonner';

export default function CreateCampusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ICampusInput>({
    resolver: zodResolver(CampusSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      address: '',
      active: true,
    }
  });

  const isActive = watch('active');

  const onSubmit: SubmitHandler<ICampusInput> = async (data) => {
    setLoading(true);
    const result = await CreateCampus({ data });
    
    if (result.success) {
      toast.success("Campus created successfully");
      router.push('/campuses');
    } else {
      toast.error("Failed to create campus");
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Campus</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Register a new campus or branch for the school.</p>
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
                    <Building2 className="w-4 h-4 mr-2 text-primary" />
                    Campus Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Main Campus" 
                    className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-primary" />
                      Email Address (Optional)
                    </Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="campus@example.com" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                      {...register('email')}
                    />
                    {errors.email && <ErrorMessage message={errors.email.message} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-primary" />
                      Phone Number (Optional)
                    </Label>
                    <Input 
                      id="phone_number"
                      placeholder="+256 ..." 
                      className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                      {...register('phone_number')}
                    />
                    {errors.phone_number && <ErrorMessage message={errors.phone_number.message} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    Physical Address (Optional)
                  </Label>
                  <Input 
                    id="address"
                    placeholder="Plot 12, High Street" 
                    className="h-12 rounded-xl border-gray-200 focus:ring-primary"
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
                <ToggleLeft className="w-5 h-5 mr-2 text-primary" />
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
                className="w-full h-12 rounded-xl font-bold bg-primary"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Campus
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
