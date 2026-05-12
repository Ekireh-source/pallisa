'use client';

import React, { useEffect, useState } from 'react';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ErrorMessage,
  
} from '@/components/ui';
import { SchoolSchema, ISchoolInput } from '@/features/school/school.schemas';
import { CreateSchool, FetchCampuses } from '@/features/school/school.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function CreateSchoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingCampuses, setFetchingCampuses] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ISchoolInput>({
    resolver: zodResolver(SchoolSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      address: '',
      active: true,
      campus: undefined,
    }
  });

  const isActive = watch('active');
  const selectedCampus = watch('campus');

  useEffect(() => {
    const loadCampuses = async () => {
      setFetchingCampuses(true);
      const result = await FetchCampuses();
      if (result.success) {
        setCampuses(result.data.results || result.data);
      }
      setFetchingCampuses(false);
    };

    loadCampuses();
  }, []);

  const onSubmit: SubmitHandler<ISchoolInput> = async (data) => {
    setLoading(true);
    const result = await CreateSchool({ data });
    
    if (result.success) {
      toast.success("School created successfully");
      router.push('/school');
    } else {
      toast.error(result.error?.message || "Failed to create school");
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
            <h1 className="text-3xl font-bold text-gray-900">Add School</h1>
            <p className="text-gray-500 mt-1">Register a new institution in the system.</p>
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
                    <Building2 className="w-4 h-4 mr-2 text-indigo-500" />
                    School Name
                  </Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Pallisa High School" 
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
                      placeholder="school@example.com" 
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
                    placeholder="Plot 45, Main Street, Pallisa" 
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
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Campus (Optional)</Label>
                  <Select 
                    disabled={fetchingCampuses}
                    onValueChange={(val) => setValue('campus', val === 'none' ? null : parseInt(val))}
                    value={selectedCampus?.toString() || 'none'}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="none">No Campus</SelectItem>
                      {campuses.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">School is visible in the system</p>
                  </div>
                  <Switch 
                    checked={isActive}
                    onCheckedChange={(val: boolean) => setValue('active', val)}
                  />
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading || fetchingCampuses}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Register School
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
