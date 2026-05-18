'use client';

import React, { useEffect, useState } from 'react';
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
  BadgeCheck,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { FetchRoles } from '@/features/auth/auth.service';
import { TeacherSchema, ITeacherInput } from '@/features/members/members.schemas';
import { CreateTeacher } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function CreateTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    }
  });

  const selectedRole = watch('user_role_id');
  const isActive = watch('is_active');

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);
      const res = await FetchRoles();
      if (res.success) {
        setRoles(res.data.results);
      }
      setLoadingRoles(false);
    };
    loadRoles();
  }, []);

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
    setValue('user_profile_picture', undefined);
  };

  const onSubmit = async (values: any) => {
    const data = values as ITeacherInput;
    setLoading(true);
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'user_profile_picture' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const result = await CreateTeacher(formData);
      
      if (result.success) {
        toast.success("Teacher registered successfully");
        router.push('/teachers');
      } else {
        toast.error("Failed to register teacher");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <h1 className="text-3xl font-bold text-gray-900">New Teacher</h1>
            <p className="text-gray-500 mt-1">Register a new faculty member into the system.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
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
                  <Label htmlFor="user_email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  <select
                    id="user_gender"
                    className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('user_gender')}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_role_id">System Role</Label>
                  <Select 
                    onValueChange={(val) => setValue('user_role_id', parseInt(val))}
                    value={selectedRole?.toString()}
                  >
                    <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-indigo-500 ${errors.user_role_id ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
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
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                Professional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID (Optional, auto-generated)</Label>
                  <Input 
                    id="employee_id"
                    placeholder="e.g., TCH-2024-001" 
                    className="h-12 rounded-xl border-gray-200"
                    {...register('employee_id')}
                  />
                  {errors.employee_id && <ErrorMessage message={errors.employee_id.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <select
                    id="employment_type"
                    className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('employment_type')}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="substitute">Substitute</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization / Subjects</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="specialization"
                      placeholder="e.g., Mathematics, Physics" 
                      className="h-12 pl-10 rounded-xl border-gray-200"
                      {...register('specialization')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="qualification"
                      placeholder="e.g., B.Ed, M.Sc" 
                      className="h-12 pl-10 rounded-xl border-gray-200"
                      {...register('qualification')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-indigo-500" />
                Profile Picture
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors relative overflow-hidden group">
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
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-4 w-full">
                      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Upload Photo</p>
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

            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-indigo-500" />
                Status & Settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
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
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Register Teacher
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

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Important:</strong> Registering a teacher will automatically create a user account. They can log in using their <strong>Employee ID</strong> or <strong>Email address</strong>. If an email is provided, they will receive their credentials via email.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
