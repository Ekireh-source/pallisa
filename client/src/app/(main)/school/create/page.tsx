'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Save, Building2, Mail, Phone, MapPin, Loader2, ToggleLeft, Quote, ImagePlus, X } from 'lucide-react';
import { Button, Card, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ErrorMessage } from '@/components/ui';
import { SchoolSchema, ISchoolInput } from '@/features/school/school.schemas';
import { CreateSchool, FetchCampuses, FetchSchoolById } from '@/features/school/school.service';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setSchool } from '@/store/auth/actions';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';

export default function CreateSchoolPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [fetchingCampuses, setFetchingCampuses] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ISchoolInput>({
    resolver: zodResolver(SchoolSchema),
    defaultValues: { name: '', email: '', phone_number: '', address: '', motto: '', active: true, campus: undefined, level: 'secondary' },
  });

  const isActive = watch('active');
  const selectedCampus = watch('campus');
  const selectedLevel = watch('level') || 'secondary';

  useEffect(() => {
    FetchCampuses().then(r => {
      if (r && 'results' in r) {
        setCampuses(r.results);
      }
      setFetchingCampuses(false);
    });
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit: SubmitHandler<ISchoolInput> = async (data) => {
    setLoading(true);
    const result = await CreateSchool({ data, logo: logoFile });
    
    if (result.success && 'data' in result) {
      // Fetch the full school data using the returned ID
      const schoolId = result.data?.id || result.data?.school_id;
      if (schoolId) {
        const fetchRes = await FetchSchoolById(schoolId);
        if (fetchRes.success && 'data' in fetchRes && fetchRes.data) {
          dispatch(setSchool(fetchRes.data));
        }
      }
      
      toast.success('School created successfully');
      router.push('/school');
    } else {
      toast.error('Failed to create school');
    }
    setLoading(false);
  };

  return (
    <MainLayout
      title="Add School"
      description="Register a new institution in the system."
      backButton={
        <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" /> Basic Information
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">School Name <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="e.g., Pallisa High School" className={`h-12 rounded-xl ${errors.name ? 'border-red-500' : 'border-gray-200'}`} {...register('name')} />
                  {errors.name && <ErrorMessage message={errors.name.message} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-500" /> Email</Label>
                    <Input id="email" type="email" placeholder="school@example.com" className="h-12 rounded-xl border-gray-200" {...register('email')} />
                    {errors.email && <ErrorMessage message={errors.email.message} />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-500" /> Phone</Label>
                    <Input id="phone_number" placeholder="+256 ..." className="h-12 rounded-xl border-gray-200" {...register('phone_number')} />
                    {errors.phone_number && <ErrorMessage message={errors.phone_number.message} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Address</Label>
                  <Input id="address" placeholder="Plot 45, Main Street, Pallisa" className="h-12 rounded-xl border-gray-200" {...register('address')} />
                  {errors.address && <ErrorMessage message={errors.address.message} />}
                </div>
              </div>
            </Card>

            {/* Branding */}
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Quote className="w-5 h-5 text-indigo-500" /> Branding & Identity
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motto" className="text-sm font-semibold text-gray-700">School Motto</Label>
                  <Input id="motto" placeholder="e.g., Excellence Through Knowledge" className="h-12 rounded-xl border-gray-200" {...register('motto')} />
                  {errors.motto && <ErrorMessage message={errors.motto.message} />}
                  <p className="text-xs text-gray-400">Displayed on report cards below the school name.</p>
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">School Logo</Label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-100" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700">{logoFile?.name}</p>
                          <p className="text-xs text-gray-400">{((logoFile?.size || 0) / 1024).toFixed(1)} KB · Click to change</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400 w-full">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImagePlus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Click to upload logo</p>
                          <p className="text-xs text-gray-400">PNG, JPG, SVG · Recommended 256×256px</p>
                        </div>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ToggleLeft className="w-5 h-5 text-indigo-500" /> Settings
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Academic Level</Label>
                  <Select onValueChange={(val) => setValue('level', val)} value={selectedLevel}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200"><SelectValue placeholder="Select Level" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="tertiary">Tertiary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Campus (Optional)</Label>
                  <Select disabled={fetchingCampuses} onValueChange={(val) => setValue('campus', val === 'none' ? null : parseInt(val))} value={selectedCampus?.toString() || 'none'}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-gray-200"><SelectValue placeholder="Select Campus" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="none">No Campus</SelectItem>
                      {campuses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div>
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">School is visible in the system</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={(val: boolean) => setValue('active', val)} />
                </div>
              </div>
            </Card>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold" disabled={loading || fetchingCampuses}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Register School
              </Button>
              <Button type="button" variant="ghost" className="w-full h-11 rounded-xl text-gray-500" onClick={() => router.back()}>Cancel</Button>
            </div>
          </div>
        </div>
        </form>
      </div>
    </MainLayout>
  );
}
