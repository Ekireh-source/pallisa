'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentById, updateStudent, clearFieldErrors, clearCurrentStudent } from '@/store/slices/memberStudentSlice';
import { fetchStreams } from '@/store/slices/memberStreamSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, Edit, GraduationCap, Activity, FileText, AlertCircle } from 'lucide-react';
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Edit className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Loading Student Details</h1>
              <p className="text-blue-100 text-lg">Please wait while we fetch the student information</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
            <Link
              href={`/members/students/${studentId}`}
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Student
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-600">Loading student details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Error Loading Student</h1>
              <p className="text-blue-100 text-lg">Unable to load student details</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Error occurred</span>
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
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Student
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
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Student Not Found</h1>
              <p className="text-blue-100 text-lg">The requested student could not be found</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Not found</span>
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
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Student Not Found
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-yellow-700">The requested student could not be found in the system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Edit className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Edit Student</h1>
            <p className="text-blue-100 text-lg">
              Update student information for {currentStudent.user_profile_data?.first_name} {currentStudent.user_profile_data?.last_name}
            </p>
          </div>
          <Link
            href={`/members/students/${studentId}`}
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Student
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Student Management</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Academic Records</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-100">Student ID: {currentStudent.student_id}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Updating Student
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
            <CardDescription>
              Update student&apos;s basic information and contact details
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
                />
                {fieldErrors.user_first_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_last_name">Last Name</Label>
                <Input
                  id="user_last_name"
                  name="user_last_name"
                  type="text"
                  value={formData.user_last_name}
                  onChange={handleInputChange}
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
                  value={formData.user_other_name}
                  onChange={handleInputChange}
                  placeholder="Middle name, nickname, etc."
                />
                {fieldErrors.user_other_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_other_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email Address</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={handleInputChange}
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
                  value={formData.user_phone}
                  onChange={handleInputChange}
                />
                {fieldErrors.user_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.user_phone}</p>
                )}
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
                <Label htmlFor="admission_date">Admission Date</Label>
                <Input
                  id="admission_date"
                  name="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={handleInputChange}
                />
                {fieldErrors.admission_date && (
                  <p className="text-sm text-red-600">{fieldErrors.admission_date}</p>
                )}
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
                  />
                  {fieldErrors.graduation_date && (
                    <p className="text-sm text-red-600">{fieldErrors.graduation_date}</p>
                  )}
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