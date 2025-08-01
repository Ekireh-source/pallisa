'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createStudent, clearFieldErrors } from '@/store/slices/memberStudentSlice';
import { fetchStreams } from '@/store/slices/memberStreamSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, User, GraduationCap, Heart, FileText, Users, Plus, AlertCircle } from 'lucide-react';
import { BulkStudentUpload } from '@/components/forms/BulkStudentUpload';
import type { StudentCreateUpdate } from '@/types';

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export default function CreateStudentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.memberStudents);
  const { streams, loading: streamsLoading } = useAppSelector((state) => state.memberStreams);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Add mode state for switching between single and bulk upload
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  const [formData, setFormData] = useState<StudentCreateUpdate>({
    // User creation fields
    user_email: '',
    user_student_id: '',
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
    // Student specific fields
    current_stream: undefined,
    enrollment_status: 'enrolled',
    admission_date: '',
    graduation_date: '',
    previous_school: '',
    special_needs: '',
    medical_conditions: '',
    allergies: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
    // Load streams for dropdown
    dispatch(fetchStreams({}));
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || undefined
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty string values
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined) {
        acc[key as keyof StudentCreateUpdate] = value;
      }
      return acc;
    }, {} as Partial<StudentCreateUpdate>);

    // Ensure required fields are present
    const finalData: StudentCreateUpdate = {
      enrollment_status: 'enrolled', // Default enrollment status
      ...cleanedData
    };
    
    // If user_student_id is provided, also set student_id
    if (finalData.user_student_id) {
      finalData.student_id = finalData.user_student_id;
    }
    
    try {
      const result = await dispatch(createStudent(finalData));
      if (createStudent.fulfilled.match(result)) {
        router.push('/members/students');
      }
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const handleCancel = () => {
    router.push('/members/students');
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'single' ? 'Add New Student' : 'Bulk Upload Students'}
            </h1>
            <p className="text-blue-100 text-lg">
              {mode === 'single' 
                ? 'Create a comprehensive student record with all required information'
                : 'Upload multiple students at once using an Excel file'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm">Student Management</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Academic Records</span>
            </div>
          </div>
          <Link
            href="/members/students"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Students
          </Link>
        </div>
      </div>

      {/* Mode Toggle */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Upload Mode</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Choose between single student creation or bulk upload
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Upload Mode:</span>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={mode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('single')}
                className={`flex items-center space-x-2 ${
                  mode === 'single' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-200'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Single Student</span>
              </Button>
              <Button
                variant={mode === 'bulk' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('bulk')}
                className={`flex items-center space-x-2 ${
                  mode === 'bulk' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Bulk Upload</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Creating Student
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

      {/* Conditional Content */}
      {mode === 'single' ? (
        /* Create Form */
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
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
                />
                {fieldErrors.user_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_student_id">Student ID (Optional)</Label>
                <Input
                  id="user_student_id"
                  name="user_student_id"
                  type="text"
                  value={formData.user_student_id || ''}
                  onChange={handleInputChange}
                  placeholder="Leave blank for auto-generation"
                />
                <p className="text-xs text-gray-500">
                  Enter a unique student ID or leave blank to auto-generate one. 
                  If provided, this ID must be unique across all students.
                </p>
                {fieldErrors.user_student_id && (
                  <p className="text-sm text-red-600">{fieldErrors.user_student_id}</p>
                )}
              </div>
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
              Emergency contact details for student safety
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
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <span>Academic Information</span>
            </CardTitle>
            <CardDescription>
              Academic status and enrollment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="enrollment_status">
                  Enrollment Status <span className="text-red-500">*</span>
                </Label>
                <select
                  id="enrollment_status"
                  name="enrollment_status"
                  value={formData.enrollment_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ENROLLMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.enrollment_status && (
                  <p className="text-sm text-red-600">{fieldErrors.enrollment_status}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stream">Current Stream</Label>
                <select
                  id="current_stream"
                  name="current_stream"
                  value={formData.current_stream || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={streamsLoading}
                >
                  <option value="">Select a stream...</option>
                  {streams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.name} - {stream.class_obj_name}
                    </option>
                  ))}
                </select>
                {streamsLoading && (
                  <p className="text-sm text-gray-500">Loading streams...</p>
                )}
                {fieldErrors.current_stream && (
                  <p className="text-sm text-red-600">{fieldErrors.current_stream}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input
                  id="admission_date"
                  name="admission_date"
                  type="date"
                  value={formData.admission_date || ''}
                  onChange={handleInputChange}
                />
                {fieldErrors.admission_date && (
                  <p className="text-sm text-red-600">{fieldErrors.admission_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_school">Previous School</Label>
                <Input
                  id="previous_school"
                  name="previous_school"
                  type="text"
                  value={formData.previous_school || ''}
                  onChange={handleInputChange}
                  placeholder="Enter previous school name"
                />
                {fieldErrors.previous_school && (
                  <p className="text-sm text-red-600">{fieldErrors.previous_school}</p>
                )}
              </div>
            </div>

            {formData.enrollment_status === 'graduated' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="graduation_date">Graduation Date</Label>
                  <Input
                    id="graduation_date"
                    name="graduation_date"
                    type="date"
                    value={formData.graduation_date || ''}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.graduation_date && (
                    <p className="text-sm text-red-600">{fieldErrors.graduation_date}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health & Special Needs Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Health & Special Needs Information</span>
            </CardTitle>
            <CardDescription>
              Medical conditions, allergies, and special needs information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  value={formData.medical_conditions || ''}
                  onChange={handleInputChange}
                  placeholder="List any medical conditions"
                  rows={3}
                />
                {fieldErrors.medical_conditions && (
                  <p className="text-sm text-red-600">{fieldErrors.medical_conditions}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies || ''}
                  onChange={handleInputChange}
                  placeholder="List any known allergies"
                  rows={3}
                />
                {fieldErrors.allergies && (
                  <p className="text-sm text-red-600">{fieldErrors.allergies}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_needs">Special Needs</Label>
              <textarea
                id="special_needs"
                name="special_needs"
                value={formData.special_needs || ''}
                onChange={handleInputChange}
                placeholder="Describe any special needs or accommodations required"
                rows={3}
              />
              {fieldErrors.special_needs && (
                <p className="text-sm text-red-600">{fieldErrors.special_needs}</p>
              )}
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
                    <span>Creating Student...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Student</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      ) : (
        <BulkStudentUpload onSuccess={() => router.push('/members/students')} />
      )}
    </div>
  );
} 