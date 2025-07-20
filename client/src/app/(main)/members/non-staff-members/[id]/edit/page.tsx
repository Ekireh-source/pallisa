
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchNonStaffMemberById, updateNonStaffMember, clearFieldErrors } from '@/store/slices/memberNonStaffSlice';
import { fetchRoles } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { ArrowLeft, Save, X, User, Briefcase, Heart, Award, Shield } from 'lucide-react';
import type { NonStaffMemberCreateUpdate, Role } from '@/types';

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'volunteer', label: 'Volunteer' },
];

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export default function EditNonStaffMemberPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentNonStaffMember, loading, error, fieldErrors } = useAppSelector((state) => state.memberNonStaff);
  const { roles } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const nonStaffMemberId = params.id ? parseInt(params.id as string) : null;

  console.log("currentNonStaffMember", currentNonStaffMember);

  const [formData, setFormData] = useState<NonStaffMemberCreateUpdate>({
    employment_type: 'full_time',
    specialization: '',
    qualification: '',
    hire_date: '',
    years_of_experience: 0,
    previous_experience: '',
    salary: undefined,
    user_role_id: undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (nonStaffMemberId) {
      dispatch(fetchNonStaffMemberById(nonStaffMemberId));
      dispatch(fetchRoles({}));
    }
  }, [isAuthenticated, router, dispatch, nonStaffMemberId]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
  }, [dispatch]);

  useEffect(() => {
    if (currentNonStaffMember) {
      const member = currentNonStaffMember as any;
      setFormData({
        employment_type: member.employment_type || 'full_time',
        specialization: member.specialization || '',
        qualification: member.qualification || '',
        hire_date: member.hire_date || '',
        years_of_experience: member.years_of_experience || 0,
        previous_experience: member.previous_experience || '',
        salary: member.salary || undefined,
        user_role_id: member.user_profile_data?.role?.id || undefined,
      });
    }
  }, [currentNonStaffMember]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    let processedValue: any = value;
    if (name === 'years_of_experience') {
      processedValue = value === '' ? 0 : parseInt(value) || 0;
    } else if (name === 'salary') {
      processedValue = value === '' ? undefined : parseFloat(value) || undefined;
    } else if (value === '') {
      processedValue = undefined;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      user_role_id: roleId === 'none' ? undefined : parseInt(roleId)
    }));

    // Clear field error when user changes role
    if (fieldErrors.user_role_id) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nonStaffMemberId) return;
    
    // Clean up empty string values
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    try {
      const result = await dispatch(updateNonStaffMember({ id: nonStaffMemberId, data: cleanedData }));
      
      if (updateNonStaffMember.fulfilled.match(result)) {
        router.push(`/members/non-staff-members/${nonStaffMemberId}`);
      }
    } catch (error) {
      console.error('Error updating non-staff member:', error);
    }
  };

  const handleCancel = () => {
    if (nonStaffMemberId) {
      router.push(`/members/non-staff-members/${nonStaffMemberId}`);
    } else {
      router.push('/members/non-staff-members');
    }
  };

  // Filter roles to show only staff-appropriate roles (excluding superadmin)
  const staffRoles = roles.filter(role => 
    !role.is_superadmin && 
    (role.name.toLowerCase().includes('staff') || 
     role.name.toLowerCase().includes('admin') ||
     role.name.toLowerCase().includes('non-staff') ||
     role.name.toLowerCase().includes('coordinator') ||
     role.name.toLowerCase().includes('manager') ||
     role.name.toLowerCase().includes('assistant'))
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

  if (loading && !currentNonStaffMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="h-12 w-12 mx-auto" />
          <p className="mt-4 text-gray-600">Loading non-staff member details...</p>
        </div>
      </div>
    );
  }

  if (error && !currentNonStaffMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/members/non-staff-members">
            <Button variant="outline">Back to Non-Staff Members</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentNonStaffMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-semibold mb-4">Non-Staff Member Not Found</div>
          <Link href="/members/non-staff-members">
            <Button variant="outline">Back to Non-Staff Members</Button>
          </Link>
        </div>
      </div>
    );
  }

  const member = currentNonStaffMember as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/members/non-staff-members/${nonStaffMemberId}`}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Details</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Non-Staff Member</h1>
            <p className="text-gray-600 mt-1">Update information for {member.user_profile_data?.get_full_name || member.full_name}</p>
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
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Non-Staff Member Information</span>
          </CardTitle>
          <CardDescription>
            Update the non-staff member's professional details and role assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Assignment */}
            <div className="space-y-2">
              <Label htmlFor="user_role_id">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Role Assignment</span>
                </div>
              </Label>
              <Select 
                value={formData.user_role_id?.toString() || 'none'} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Choose a role for this staff member" />
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
                Assigning a role will automatically grant the associated permissions to this staff member.
              </p>
            </div>

            <hr className="border-gray-200" />

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employment_type">
                  Employment Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
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
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  name="years_of_experience"
                  type="number"
                  min="0"
                  value={formData.years_of_experience || 0}
                  onChange={handleInputChange}
                  placeholder="Enter years of experience"
                />
                {fieldErrors.years_of_experience && (
                  <p className="text-sm text-red-600">{fieldErrors.years_of_experience}</p>
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
                  placeholder="Enter specialization"
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

            <div className="space-y-2">
              <Label htmlFor="previous_experience">Previous Experience</Label>
              <Textarea
                id="previous_experience"
                name="previous_experience"
                value={formData.previous_experience || ''}
                onChange={handleInputChange}
                placeholder="Enter previous work experience..."
                rows={3}
              />
              {fieldErrors.previous_experience && (
                <p className="text-sm text-red-600">{fieldErrors.previous_experience}</p>
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
                    <span>Updating Non-Staff Member...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Non-Staff Member</span>
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