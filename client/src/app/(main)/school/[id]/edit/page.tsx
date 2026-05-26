'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Save, Building2, Mail, Phone, MapPin, Loader2, ToggleLeft, Trash2, Quote, ImagePlus, X, Eye } from 'lucide-react';
import { Button, Card, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ErrorMessage, Skeleton } from '@/components/ui';
import { SchoolSchema, ISchoolInput } from '@/features/school/school.schemas';
import { FetchSchoolById, UpdateSchool, DeleteSchool, FetchCampuses } from '@/features/school/school.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatImgUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}

export default function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ISchoolInput>({
    resolver: zodResolver(SchoolSchema),
  });

  const isActive = watch('active');
  const selectedCampus = watch('campus');
  const selectedLevel = watch('level') || 'secondary';

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true);
      const [campusRes, schoolRes] = await Promise.all([FetchCampuses(), FetchSchoolById(id)]);
      if (campusRes && 'results' in campusRes) {
        setCampuses(campusRes.results);
      }
      if (schoolRes.success) {
        const s = schoolRes.data;
        reset({ name: s.name, email: s.email, phone_number: s.phone_number, address: s.address, motto: s.motto || '', campus: s.campus, active: s.active, level: s.level || 'secondary' });
        if (s.logo) setExistingLogo(s.logo);
      } else {
        toast.error('Failed to load school details');
        router.push('/school');
      }
      setFetchingData(false);
    };
    loadData();
  }, [id, reset, router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onSubmit = async (data: ISchoolInput) => {
    setLoading(true);
    const result = await UpdateSchool({ id, data, logo: logoFile });
    if (result.success) {
      toast.success('School updated successfully');
      router.push(`/school/${id}`);
    } else {
      toast.error('Failed to update school');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this school?')) {
      setLoading(true);
      const result = await DeleteSchool(id);
      if (result.success) { toast.success('School deleted'); router.push('/school'); }
      else toast.error('Failed to delete school');
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="w-full space-y-8">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
          <div><Skeleton className="h-64 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  const displayLogo = logoPreview || formatImgUrl(existingLogo);

  return (
    <MainLayout
      title="Edit School"
      description="Update registration details for this institution."
      backButton={
        <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl h-10 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
            <Link href={`/school/${id}`}><Eye className="w-4 h-4" /> View</Link>
          </Button>
          <Button variant="outline" className="h-10 rounded-xl text-rose-50 border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/30 hover:text-white" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
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
                    {displayLogo ? (
                      <>
                        <img src={displayLogo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-gray-100 bg-gray-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700">
                            {logoFile ? logoFile.name : 'Current logo'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {logoFile ? `${((logoFile.size) / 1024).toFixed(1)} KB · ` : ''}Click to replace
                          </p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); clearLogo(); setExistingLogo(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
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
                  <Select onValueChange={(val) => setValue('campus', val === 'none' ? null : parseInt(val))} value={selectedCampus?.toString() || 'none'}>
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
                  <Switch checked={isActive} onCheckedChange={(val) => setValue('active', val)} />
                </div>
              </div>
            </Card>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Update School
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
