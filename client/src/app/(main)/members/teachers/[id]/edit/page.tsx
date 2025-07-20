'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchTeacherById, updateTeacher, clearFieldErrors, clearCurrentTeacher } from '@/store/slices/memberTeacherSlice';
import { fetchRoles } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { ArrowLeft, Save, X, Shield } from 'lucide-react';
import type { TeacherCreateUpdate } from '@/types';

const TEACHER_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'volunteer', label: 'Volunteer' },
];

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentTeacher, loading, error, fieldErrors } = useAppSelector((state) => state.memberTeachers);
  const { roles } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const teacherId = parseInt(params.id as string);

  const [formData, setFormData] = useState<TeacherCreateUpdate>({
    user_email: '',
    user_first_name: '',
    user_last_name: '',
    user_other_name: '',
    user_phone: '',
    user_role_id: undefined,
    user_role: 'none',
    employment_type: 'full_time',
    hire_date: '',
    salary: '',
    qualification: '',
    specialization: '',
  });

  console.log("formData", formData);

  const [isFormLoaded, setIsFormLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && teacherId) {
      dispatch(fetchTeacherById(teacherId));
      dispatch(fetchRoles({}));
    }

    // Clear field errors when component mounts
    dispatch(clearFieldErrors());

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentTeacher());
    };
  }, [dispatch, teacherId, isAuthenticated]);

  // Update form data when teacher data is loaded
  useEffect(() => {
    if (currentTeacher && !isFormLoaded) {
      const roleId = currentTeacher.user_profile_data?.role?.id;
      
      // Ensure roleId is a valid number or undefined
      const validRoleId = typeof roleId === 'number' && !isNaN(roleId) ? roleId : undefined;
      
      setFormData({
        user_email: typeof currentTeacher.user_profile_data?.user === 'object' && currentTeacher.user_profile_data.user.email 
          ? currentTeacher.user_profile_data.user.email 
          : '',
        user_first_name: currentTeacher.user_profile_data?.first_name || '',
        user_last_name: currentTeacher.user_profile_data?.last_name || '',
        user_other_name: currentTeacher.user_profile_data?.other_name || '',
        user_phone: currentTeacher.user_profile_data?.phone || '',
        user_role_id: validRoleId,
        employment_type: currentTeacher.employment_type,
        hire_date: currentTeacher.hire_date || '',
        salary: currentTeacher.salary || '',
        qualification: currentTeacher.qualification || '',
        specialization: currentTeacher.specialization || '',
      });
      setIsFormLoaded(true);
    }
  }, [currentTeacher, isFormLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleRoleChange = (roleId: string) => {
    const parsedRoleId = roleId === 'none' ? undefined : Number(roleId);
    const validRoleId = parsedRoleId !== undefined && !isNaN(parsedRoleId) ? parsedRoleId : undefined;
    
    setFormData(prev => ({
      ...prev,
      user_role_id: validRoleId
    }));

    // Clear field error when user changes role
    if (fieldErrors.user_role_id) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(updateTeacher({ id: teacherId, data: formData }));
      if (updateTeacher.fulfilled.match(result)) {
        router.push(`/members/teachers/${teacherId}`);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/members/teachers/${teacherId}`);
  };

  // Filter roles to show only staff-appropriate roles (excluding superadmin)
  const staffRoles = roles.filter(role => 
    !role.is_superadmin && 
    (role.name.toLowerCase().includes('teacher') || 
     role.name.toLowerCase().includes('staff') || 
     role.name.toLowerCase().includes('admin') ||
     role.name.toLowerCase().includes('coordinator') ||
     role.name.toLowerCase().includes('head') ||
     role.name.toLowerCase().includes('principal'))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && !currentTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/teachers">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Teachers</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading teacher details...</span>
        </div>
      </div>
    );
  }

  if (error && !currentTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/teachers">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Teachers</span>
            </Button>
          </Link>
        </div>
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/teachers">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Teachers</span>
            </Button>
          </Link>
        </div>
        <Card className="bg-yellow-50 border border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">Teacher not found</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/members/teachers/${teacherId}`}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Details</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Teacher</h1>
            <p className="text-gray-600 mt-1">
              {currentTeacher.user_profile_data ? 
                `${currentTeacher.user_profile_data.first_name} ${currentTeacher.user_profile_data.last_name}` : 
                'Teacher Details'
              } - ID: {currentTeacher.employee_id}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Teacher Information</CardTitle>
          <CardDescription>
            Update the teacher&apos;s personal and professional details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_first_name"
                  name="user_first_name"
                  type="text"
                  value={formData.user_first_name}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
                {fieldErrors.user_first_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_last_name"
                  name="user_last_name"
                  type="text"
                  value={formData.user_last_name}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
                {fieldErrors.user_last_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_other_name">Other Name</Label>
                <Input
                  id="user_other_name"
                  name="user_other_name"
                  type="text"
                  value={formData.user_other_name || ''}
                  onChange={handleInputChange}
                  placeholder="Middle name, nickname, etc."
                />
                {fieldErrors.user_other_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_other_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
                {fieldErrors.user_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_phone">Phone Number</Label>
                <Input
                  id="user_phone"
                  name="user_phone"
                  type="tel"
                  value={formData.user_phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
                {fieldErrors.user_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.user_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_role_id">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Role Assignment</span>
                  </div>
                </Label>
                <Select 
                  value={formData.user_role_id ? formData.user_role?.toString() : 'none'} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Choose a role for this teacher" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="none" className="text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>No Role Assigned</span>
                      </div>
                    </SelectItem>
                    {staffRoles.length > 0 ? (
                      staffRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()} className="py-3">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="font-medium">{role.name}</span>
                            </div>
                            {role.description && (
                              <span className="text-xs text-gray-500 ml-4">{role.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-roles" disabled className="text-gray-400">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          <span>No roles available</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {fieldErrors.user_role_id && (
                  <p className="text-sm text-red-600">{fieldErrors.user_role_id}</p>
                )}
                <p className="text-xs text-gray-500">
                  Assigning a role will automatically grant the associated permissions to this teacher.
                </p>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employment_type">
                  Teacher Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {TEACHER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.employment_type && (
                  <p className="text-sm text-red-600">{fieldErrors.employment_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={formData.hire_date || ''}
                  onChange={handleInputChange}
                />
                {fieldErrors.hire_date && (
                  <p className="text-sm text-red-600">{fieldErrors.hire_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary || ''}
                  onChange={handleInputChange}
                  placeholder="Enter salary amount"
                />
                {fieldErrors.salary && (
                  <p className="text-sm text-red-600">{fieldErrors.salary}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  type="text"
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                  placeholder="Enter teaching specialization"
                />
                {fieldErrors.specialization && (
                  <p className="text-sm text-red-600">{fieldErrors.specialization}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualifications</Label>
              <Textarea
                id="qualification"
                name="qualification"
                value={formData.qualification || ''}
                onChange={handleInputChange}
                placeholder="Enter educational qualifications and certifications..."
                rows={3}
              />
              {fieldErrors.qualification && (
                <p className="text-sm text-red-600">{fieldErrors.qualification}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span>Updating Teacher...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Teacher</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 