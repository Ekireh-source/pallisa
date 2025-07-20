'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentById, updateStudent, clearFieldErrors, clearCurrentStudent } from '@/store/slices/memberStudentSlice';
import { fetchStreams } from '@/store/slices/memberStreamSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { StudentCreateUpdate } from '@/types';

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentStudent, loading, error, fieldErrors } = useAppSelector((state) => state.memberStudents);
  const { streams, loading: streamsLoading } = useAppSelector((state) => state.memberStreams);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const studentId = parseInt(params.id as string);

  const [formData, setFormData] = useState<StudentCreateUpdate>({
    user_email: '',
    user_first_name: '',
    user_last_name: '',
    user_other_name: '',
    user_phone: '',
    current_stream: undefined,
    enrollment_status: 'enrolled',
    admission_number: '',
    admission_date: '',
    graduation_date: '',
  });

  const [isFormLoaded, setIsFormLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && studentId) {
      dispatch(fetchStudentById(studentId));
    }

    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
    // Load streams for dropdown
    dispatch(fetchStreams({}));

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, studentId, isAuthenticated]);

  // Update form data when student data is loaded
  useEffect(() => {
    if (currentStudent && !isFormLoaded) {
      setFormData({
        user_email: typeof currentStudent.user_profile_data?.user === 'object' && currentStudent.user_profile_data.user.email 
          ? currentStudent.user_profile_data.user.email 
          : '',
        user_first_name: currentStudent.user_profile_data?.first_name || '',
        user_last_name: currentStudent.user_profile_data?.last_name || '',
        user_other_name: currentStudent.user_profile_data?.other_name || '',
        user_phone: currentStudent.user_profile_data?.phone || '',
        current_stream: currentStudent.current_stream?.id,
        enrollment_status: currentStudent.enrollment_status,
        admission_number: currentStudent.admission_number || '',
        admission_date: currentStudent.admission_date || '',
        graduation_date: currentStudent.graduation_date || '',
      });
      setIsFormLoaded(true);
    }
  }, [currentStudent, isFormLoaded]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(updateStudent({ id: studentId, data: formData }));
      if (updateStudent.fulfilled.match(result)) {
        router.push(`/members/students/${studentId}`);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/members/students/${studentId}`);
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

  if (loading && !currentStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/students">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Students</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading student details...</span>
        </div>
      </div>
    );
  }

  if (error && !currentStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/students">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Students</span>
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

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/students">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Students</span>
            </Button>
          </Link>
        </div>
        <Card className="bg-yellow-50 border border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">Student not found</span>
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
          <Link href={`/members/students/${studentId}`}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Details</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-600 mt-1">
              {currentStudent.user_profile ? 
                `${currentStudent.user_profile.first_name} ${currentStudent.user_profile.last_name}` : 
                'Student Details'
              }
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
            <CardDescription>
              Update student's basic information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_first_name">First Name</Label>
                <Input
                  id="user_first_name"
                  name="user_first_name"
                  type="text"
                  value={formData.user_first_name}
                  onChange={handleInputChange}
                  error={fieldErrors.user_first_name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_last_name">Last Name</Label>
                <Input
                  id="user_last_name"
                  name="user_last_name"
                  type="text"
                  value={formData.user_last_name}
                  onChange={handleInputChange}
                  error={fieldErrors.user_last_name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_other_name">Other Name</Label>
                <Input
                  id="user_other_name"
                  name="user_other_name"
                  type="text"
                  value={formData.user_other_name}
                  onChange={handleInputChange}
                  error={fieldErrors.user_other_name}
                  placeholder="Middle name, nickname, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email Address</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={handleInputChange}
                  error={fieldErrors.user_email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_phone">Phone Number</Label>
                <Input
                  id="user_phone"
                  name="user_phone"
                  type="tel"
                  value={formData.user_phone}
                  onChange={handleInputChange}
                  error={fieldErrors.user_phone}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollment_status">Enrollment Status</Label>
                <select
                  id="enrollment_status"
                  name="enrollment_status"
                  value={formData.enrollment_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Label htmlFor="current_stream">Stream</Label>
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

              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input
                  id="admission_number"
                  name="admission_number"
                  type="text"
                  value={formData.admission_number}
                  onChange={handleInputChange}
                  error={fieldErrors.admission_number}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input
                  id="admission_date"
                  name="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={handleInputChange}
                  error={fieldErrors.admission_date}
                />
              </div>

              {formData.enrollment_status === 'graduated' && (
                <div className="space-y-2">
                  <Label htmlFor="graduation_date">Graduation Date</Label>
                  <Input
                    id="graduation_date"
                    name="graduation_date"
                    type="date"
                    value={formData.graduation_date}
                    onChange={handleInputChange}
                    error={fieldErrors.graduation_date}
                  />
                </div>
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Student</span>
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