'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createNonStaffMember, clearFieldErrors, fetchNonStaffMembers } from '@/store/slices/memberNonStaffSlice';
import { fetchRoles } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { ArrowLeft, Save, X, User, Briefcase, Heart, Shield, Plus, Users, FileText, AlertCircle } from 'lucide-react';
import type { NonStaffMemberCreateUpdate } from '@/types';

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

export default function CreateNonStaffMemberPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.memberNonStaff);
  const { roles } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<NonStaffMemberCreateUpdate>({
    // User creation fields
    user_email: '',
    // UserProfile creation fields
    user_first_name: '',
    user_last_name: '',
    user_other_name: '',
    user_gender: undefined,
    user_dob: '',
    user_phone: '',
    user_emergency_contact: '',
    user_emergency_phone: '',
    user_emergency_contact_address: '',
    user_emergency_contact_email: '',
    user_role_id: undefined,
    // Non-staff member specific fields
    employment_type: 'full_time',
    specialization: '',
    qualification: '',
    hire_date: '',
    years_of_experience: 0,
    previous_experience: '',
    salary: undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
    // Fetch roles for role selection
    dispatch(fetchRoles({}));
  }, [dispatch]);

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
    
    // Clean up empty string values
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    try {
      const result = await dispatch(createNonStaffMember(cleanedData as unknown as NonStaffMemberCreateUpdate));
      
      if (createNonStaffMember.fulfilled.match(result)) {
        // Refresh the non-staff members list to show the new member
        dispatch(fetchNonStaffMembers({}));
        router.push('/members/non-staff-members');
      }
    } catch (error) {
      console.error('Error creating non-staff member:', error);
    }
  };

  const handleCancel = () => {
    router.push('/members/non-staff-members');
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

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Add New Non-Staff Member</h1>
            <p className="text-purple-100 text-lg">
              Create a comprehensive non-staff member record with all required information
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-purple-100">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">Member Management</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Employment Records</span>
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
              Error Creating Member
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

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Basic personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_first_name"
                  name="user_first_name"
                  type="text"
                  value={formData.user_first_name || ''}
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
                  value={formData.user_last_name || ''}
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
                  placeholder="Enter other name"
                />
                {fieldErrors.user_other_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_other_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_gender">Gender</Label>
                <select
                  id="user_gender"
                  name="user_gender"
                  value={formData.user_gender || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.user_gender && (
                  <p className="text-sm text-red-600">{fieldErrors.user_gender}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_dob">Date of Birth</Label>
                <Input
                  id="user_dob"
                  name="user_dob"
                  type="date"
                  value={formData.user_dob || ''}
                  onChange={handleInputChange}
                />
                {fieldErrors.user_dob && (
                  <p className="text-sm text-red-600">{fieldErrors.user_dob}</p>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formData.user_email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
                {fieldErrors.user_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_email}</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Employee ID is auto-generated */}
        <div className="space-y-2">
          <Label>Employee ID</Label>
          <Input value="Will be auto-generated" readOnly disabled />
          <p className="text-xs text-gray-500">Employee ID will be assigned automatically after creation.</p>
        </div>

        {/* Employment Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              <span>Employment Information</span>
            </CardTitle>
            <CardDescription>
              Employment details, specialization, and work history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm"
                >
                  <option value="">Select employment type</option>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  name="qualification"
                  type="text"
                  value={formData.qualification || ''}
                  onChange={handleInputChange}
                  placeholder="Enter qualification"
                />
                {fieldErrors.qualification && (
                  <p className="text-sm text-red-600">{fieldErrors.qualification}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  name="years_of_experience"
                  type="number"
                  value={formData.years_of_experience || ''}
                  onChange={handleInputChange}
                  placeholder="Enter years of experience"
                  min="0"
                />
                {fieldErrors.years_of_experience && (
                  <p className="text-sm text-red-600">{fieldErrors.years_of_experience}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary (UGX)</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  value={formData.salary ?? ''}
                  onChange={handleInputChange}
                  placeholder="Enter amount in UGX"
                />
                {fieldErrors.salary && (
                  <p className="text-sm text-red-600">{fieldErrors.salary}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previous_experience">Previous Experience</Label>
              <Textarea
                id="previous_experience"
                name="previous_experience"
                value={formData.previous_experience || ''}
                onChange={handleInputChange}
                placeholder="Enter previous work experience"
                rows={3}
              />
              {fieldErrors.previous_experience && (
                <p className="text-sm text-red-600">{fieldErrors.previous_experience}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <span>Emergency Contact Information</span>
            </CardTitle>
            <CardDescription>
              Emergency contact details for member safety
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact">Emergency Contact Name</Label>
                <Input
                  id="user_emergency_contact"
                  name="user_emergency_contact"
                  type="text"
                  value={formData.user_emergency_contact || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                />
                {fieldErrors.user_emergency_contact && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="user_emergency_phone"
                  name="user_emergency_phone"
                  type="tel"
                  value={formData.user_emergency_phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact phone"
                />
                {fieldErrors.user_emergency_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact_address">Emergency Contact Address</Label>
                <Input
                  id="user_emergency_contact_address"
                  name="user_emergency_contact_address"
                  type="text"
                  value={formData.user_emergency_contact_address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact address"
                />
                {fieldErrors.user_emergency_contact_address && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact_address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact_email">Emergency Contact Email</Label>
                <Input
                  id="user_emergency_contact_email"
                  name="user_emergency_contact_email"
                  type="email"
                  value={formData.user_emergency_contact_email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact email"
                />
                {fieldErrors.user_emergency_contact_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact_email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-end space-x-4">
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
                    <span>Creating Member...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Member</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 