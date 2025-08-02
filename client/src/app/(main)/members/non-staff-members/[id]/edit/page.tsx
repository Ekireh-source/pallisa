
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
import { ArrowLeft, Save, User, Edit, FileText, AlertCircle } from 'lucide-react';
import type { NonStaffMemberCreateUpdate } from '@/types';
import { NonStaffMember } from '@/types';

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'volunteer', label: 'Volunteer' },
];

function isUserProfile(obj: unknown): obj is { role?: { id: number } } {
  return typeof obj === 'object' && obj !== null && 'role' in obj;
}

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
      const member = currentNonStaffMember as NonStaffMember;
      setFormData({
        employment_type: member.employment_type === 'temporary' ? 'substitute' : member.employment_type || 'full_time',
        specialization: member.specialization || '',
        qualification: member.qualification || '',
        hire_date: member.hire_date || '',
        years_of_experience: member.years_of_experience || 0,
        previous_experience: member.previous_experience || '',
        salary: member.salary || undefined,
        user_role_id: (isUserProfile(member.user_profile) && member.user_profile.role) ? member.user_profile.role.id : undefined,
      });
    }
  }, [currentNonStaffMember]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    let processedValue: string | number | undefined = value;
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
        (acc as Record<string, unknown>)[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    try {
      const result = await dispatch(updateNonStaffMember({ id: nonStaffMemberId, data: cleanedData as unknown as NonStaffMemberCreateUpdate }));
      
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



  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Edit className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Non-Staff Member</h1>
            <p className="text-purple-100 text-lg">
              Update member information and employment details
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-purple-100">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Member Management</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Update Records</span>
            </div>
          </div>
          <Link
            href="/members/non-staff-members"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Members
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Updating Member
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="h-5 w-5 text-purple-600" />
            <span>Member Information</span>
          </CardTitle>
          <CardDescription>
            Update the member&apos;s professional details and role assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Assignment */}
            <div className="space-y-2">
              <Label htmlFor="user_role_id">Role Assignment</Label>
              <Select value={formData.user_role_id?.toString() || ''} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.user_role_id && (
                <p className="text-sm text-red-600">{fieldErrors.user_role_id}</p>
              )}
            </div>

            {/* Employment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <select
                  id="employment_type"
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <Label htmlFor="salary">Salary (UGX)</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  min="0"
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
                    <span>Updating Member...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Member</span>
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