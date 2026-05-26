'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ChevronLeft, 
  Save, 
  User,
  GraduationCap,
  Loader2,
  ToggleLeft,
  Mail,
  Calendar,
  Layers,
  Info,
  Building2,
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
import { StudentSchema, IStudentInput } from '@/features/members/members.schemas';
import { CreateStudent, FetchStreams } from '@/features/members/members.service';
import { FetchCampuses } from '@/features/school/school.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectSchool } from '@/store/auth/selectors';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function CreateStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Get school from selector
  const school = useSelector(selectSchool);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IStudentInput>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      user_first_name: '',
      user_last_name: '',
      user_gender: 'M',
      student_id: '',
      campus: school?.campus,
      enrollment_status: 'enrolled',
      is_active: true,
    }
  });

  // Log errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form Errors:', errors);
    }
  }, [errors]);

  const isActive = watch('is_active');
  const selectedCampus = watch('campus');

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

  // Update campus when school changes
  useEffect(() => {
    if (school?.campus && !selectedCampus) {
      setValue('campus', school.campus);
    }
  }, [school, setValue, selectedCampus]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingCampuses(true);
      const [streamsRes, campusesRes] = await Promise.all([
        FetchStreams(),
        FetchCampuses()
      ]);
      
      if (streamsRes && 'results' in streamsRes) setStreams(streamsRes.results);
      if (campusesRes && 'results' in campusesRes) setCampuses(campusesRes.results);
      setLoadingCampuses(false);
    };
    loadData();
  }, []);

  const onSubmit = async (values: any) => {
    const data = values as IStudentInput;
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

      const result = await CreateStudent(formData);
      
      if (result.success) {
        toast.success("Student created successfully");
        router.push('/students');
      } else {
        toast.error("Failed to create student");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Alert on validation errors
  const onInvalid = (errors: any) => {
    console.log('Form Errors:', errors);
    toast.error("Please fill in all required fields correctly.");
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.MANAGE_STUDENTS}>
      <MainLayout
        title="New Student"
        description="Enroll a new student into the school system."
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
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
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
                  <Label htmlFor="user_email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="user_email"
                      type="email"
                      placeholder="student@example.com" 
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
                    onValueChange={(val) => setValue('user_gender', val as 'M' | 'F' | 'O', { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-primary">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-primary" />
                Academic Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               

                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-primary" />
                    Campus
                  </Label>
                  <Select 
                    onValueChange={(val) => setValue('campus', parseInt(val))}
                    value={selectedCampus?.toString()}
                  >
                    <SelectTrigger className={`h-12 rounded-xl border-gray-200 focus:ring-primary ${errors.campus ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
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

                <div className="space-y-2">
                  <Label htmlFor="current_stream" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-primary" />
                    Assigned Stream
                  </Label>
                  <Select 
                    value={watch('current_stream')?.toString()}
                    onValueChange={(val) => setValue('current_stream', val ? parseInt(val) : undefined, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-primary">
                      <SelectValue placeholder="Select a stream" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id.toString()}>
                          {stream.class_obj_name} - {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lin">Learner Identification Number (LIN)</Label>
                  <Input 
                    id="lin"
                    placeholder="Enter LIN (e.g. LA12345678)" 
                    className="h-12 rounded-xl border-gray-200"
                    {...register('lin')}
                  />
                  {errors.lin && <ErrorMessage message={errors.lin.message} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      id="admission_date"
                      type="date"
                      className="h-12 pl-10 rounded-xl border-gray-200"
                      {...register('admission_date')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollment_status" className="text-sm font-semibold text-gray-700">Enrollment Status</Label>
                  <Select 
                    value={watch('enrollment_status')}
                    onValueChange={(val) => setValue('enrollment_status', val as any, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-primary">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Profile Picture
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/60 transition-colors relative overflow-hidden group">
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
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-primary" />
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
                <Info className="w-5 h-5 mr-2 text-primary" />
                Settings
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">Student is currently in school</p>
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
                Enroll Student
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

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Note:</strong> Enrolling a student will automatically create a user account. They can log in using their <strong>Student ID</strong> or <strong>Email address</strong>.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </MainLayout>
</ProtectedComponent>
  );
}
