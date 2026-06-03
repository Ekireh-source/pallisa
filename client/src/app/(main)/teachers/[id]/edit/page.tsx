'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  Save,
  User,
  Briefcase,
  Loader2,
  Mail,
  Calendar,
  Award,
  Info,
  Trash2,
  Camera,
  Upload,
  X,
  BadgeCheck
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { FetchRoles } from '@/features/auth/auth.service';
import { FetchCampuses } from '@/features/school/school.service';
import { IRole } from '@/features/auth/auth.schemas';
import { TeacherSchema, ITeacherInput } from '@/features/members/members.schemas';
import { FetchTeacherById, UpdateTeacher, DeleteTeacher } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialLoading ? null : null); // Dummy fix for TS

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ITeacherInput>({
    resolver: zodResolver(TeacherSchema),
    defaultValues: {
      user_first_name: '',
      user_last_name: '',
      user_email: '',
      user_gender: 'M',
      employee_id: '',
      employment_type: 'full_time',
      is_active: true,
      user_role_id: undefined,
      campus: undefined as any,
    }
  });

  const selectedRole = watch('user_role_id');
  const selectedCampus = watch('campus');
  const isActive = watch('is_active');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setValue('user_profile_picture', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setValue('user_profile_picture', null); // Set to null to indicate removal
  };

  useEffect(() => {
    const loadRolesAndCampuses = async () => {
      setLoadingRoles(true);
      setLoadingCampuses(true);
      const [rolesRes, campusesRes] = await Promise.all([
        FetchRoles(),
        FetchCampuses()
      ]);
      if (rolesRes.success) {
        setRoles(rolesRes.data.results || (Array.isArray(rolesRes.data) ? rolesRes.data : []));
      }
      if (campusesRes && 'results' in campusesRes) {
        setCampuses(campusesRes.results);
      }
      setLoadingRoles(false);
      setLoadingCampuses(false);
    };
    loadRolesAndCampuses();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      const res = await FetchTeacherById(id);

      if (res.success) {
        const teacher = res.data;
        setSelectedImage(teacher.user_profile_data?.profile_picture || null);
        reset({
          user_email: teacher.email || teacher.user_profile_data?.user?.email || '',
          user_first_name: teacher.user_profile_data?.first_name || '',
          user_last_name: teacher.user_profile_data?.last_name || '',
          user_gender: teacher.user_profile_data?.gender || 'M',
          employee_id: teacher.employee_id,
          employment_type: teacher.employment_type,
          specialization: teacher.specialization,
          qualification: teacher.qualification,
          hire_date: teacher.hire_date,
          is_active: teacher.is_active,
          user_role_id: teacher.user_profile_data?.role?.id,
          campus: teacher.campus,
        });
      } else {
        toast.error("Failed to load teacher details");
        router.push('/teachers');
      }
      setInitialLoading(false);
    };
    loadData();
  }, [id, reset, router]);

  const onSubmit = async (values: any) => {
    const data = values as ITeacherInput;
    setLoading(true);

    try {
      // Create FormData to handle file upload
      const formData = new FormData();

      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (key === 'user_profile_picture') {
            if (value instanceof File) {
              formData.append(key, value);
            } else if (value === null) {
              formData.append(key, ''); // Indicate removal
            }
          } else if (value !== null) {
            formData.append(key, String(value));
          }
        }
      });

      const result = await UpdateTeacher(id, formData);

      if (result.success) {
        toast.success("Teacher updated successfully");
        router.push(`/teachers/${id}`);
      } else {
        toast.error("Failed to update teacher");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to deactivate this teacher?")) {
      setLoading(true);
      const result = await DeleteTeacher(id);
      if (result.success) {
        toast.success("Teacher record deactivated");
        router.push('/teachers');
      } else {
        toast.error("Failed to deactivate teacher");
      }
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
            <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
          </div>
          <div className="space-y-6">
            <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_TEACHERS}>
      <MainLayout
        title="Edit Teacher"
        description="Update teacher details and system preferences."
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
            className="text-rose-600 border-transparent bg-white hover:bg-rose-50 rounded-xl font-bold h-11"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deactivate
          </Button>
        }
      >
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-8 border-none  ring-1 ring-gray-100">
                  <h3 className="text-lg font-bold text-My-Black mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="user_first_name">First Name</Label>
                      <Input
                        id="user_first_name"
                        placeholder="Enter first name"
                        className="h-12 rounded-xl border-gray-200"
                        {...register('user_first_name')}
                      />
                      {errors.user_first_name && <ErrorMessage message={errors.user_first_name.message} />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_last_name">Last Name</Label>
                      <Input
                        id="user_last_name"
                        placeholder="Enter last name"
                        className="h-12 rounded-xl border-gray-200"
                        {...register('user_last_name')}
                      />
                      {errors.user_last_name && <ErrorMessage message={errors.user_last_name.message} />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                        <Input
                          id="user_email"
                          type="email"
                          placeholder="teacher@school.edu"
                          className="h-12 pl-10 rounded-xl border-gray-200"
                          {...register('user_email')}
                        />
                      </div>
                      {errors.user_email && <ErrorMessage message={errors.user_email.message} />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_gender">Gender</Label>
                      <Select
                        value={watch('user_gender')}
                        onValueChange={(val) => setValue('user_gender', val as any, { shouldValidate: true, shouldDirty: true })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-primary">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_role_id">System Role</Label>
                      <Select
                        onValueChange={(val) => setValue('user_role_id', parseInt(val))}
                        value={selectedRole?.toString()}
                      >
                        <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.user_role_id ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                          {loadingRoles ? (
                            <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                          ) : roles.length === 0 ? (
                            <div className="p-2 text-center text-sm text-gray-500">No roles found</div>
                          ) : (
                            roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.user_role_id && <ErrorMessage message={errors.user_role_id.message} />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campus" className="text-sm font-semibold text-My-Black flex items-center">
                        Campus
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('campus', parseInt(val))}
                        value={selectedCampus?.toString()}
                      >
                        <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.campus ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select Campus" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl -xl border-gray-100">
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
                </Card>

                <Card className="p-8 border-none  ring-1 ring-gray-100">
                  <h3 className="text-lg font-bold text-My-Black mb-6 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-primary" />
                    Professional Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        placeholder="e.g., TCH-001"
                        className="h-12 rounded-xl border-gray-200"
                        {...register('employee_id')}
                      />
                      {errors.employee_id && <ErrorMessage message={errors.employee_id.message} />}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={watch('employment_type')}
                        onValueChange={(val) => setValue('employment_type', val as any, { shouldValidate: true, shouldDirty: true })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-primary">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="substitute">Substitute</SelectItem>
                          <SelectItem value="volunteer">Volunteer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <div className="relative">
                        <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                        <Input
                          id="specialization"
                          placeholder="e.g., Mathematics"
                          className="h-12 pl-10 rounded-xl border-gray-200"
                          {...register('specialization')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                        <Input
                          id="qualification"
                          placeholder="e.g., B.Ed"
                          className="h-12 pl-10 rounded-xl border-gray-200"
                          {...register('qualification')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                        <Input
                          id="hire_date"
                          type="date"
                          className="h-12 pl-10 rounded-xl border-gray-200"
                          {...register('hire_date')}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-6 border-none  ring-1 ring-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-My-Black mb-6 flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-primary" />
                    Profile Picture
                  </h3>

                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary transition-colors relative overflow-hidden group">
                      {selectedImage ? (
                        <div className="relative w-32 h-32">
                          <img
                            src={selectedImage}
                            alt="Preview"
                            className="w-32 h-32 rounded-xl object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full  hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full">
                          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-My-Black">Upload Photo</p>
                          <p className="text-[10px] text-gray-500 mt-1">JPG, PNG (Max 2MB)</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none  ring-1 ring-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-My-Black mb-6 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-primary" />
                    Status
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 ">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-My-Black">Active Status</Label>
                        <p className="text-xs text-gray-500">Teacher is currently employed</p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(val) => setValue('is_active', val)}
                      />
                    </div>
                  </div>
                </Card>

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary font-bold hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11 rounded-xl text-gray-500"
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
    </ProtectedComponent>
  );
}
