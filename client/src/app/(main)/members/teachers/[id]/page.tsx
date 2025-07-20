'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchTeacherById, deleteTeacher, clearCurrentTeacher } from '@/store/slices/memberTeacherSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, GraduationCap, AlertCircle, UserCheck, BookOpen, DollarSign, Shield } from 'lucide-react';

const TEACHER_TYPE_COLORS = {
  full_time: 'bg-green-100 text-green-800',
  part_time: 'bg-blue-100 text-blue-800',
  contract: 'bg-yellow-100 text-yellow-800',
  volunteer: 'bg-purple-100 text-purple-800',
};

const TEACHER_TYPE_LABELS = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  volunteer: 'Volunteer',
};

export default function TeacherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentTeacher, loading, error } = useAppSelector((state) => state.memberTeachers);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  console.log("currentTeacher", currentTeacher);

  const teacherId = parseInt(params.id as string);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && teacherId) {
      dispatch(fetchTeacherById(teacherId));
    }

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentTeacher());
    };
  }, [dispatch, teacherId, isAuthenticated]);

  const handleEdit = () => {
    router.push(`/members/teachers/${teacherId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTeacher(teacherId));
      router.push('/members/teachers');
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
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

  if (loading) {
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

  if (error) {
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
              <AlertCircle className="h-5 w-5" />
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
              <AlertCircle className="h-5 w-5" />
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
          <Link href="/members/teachers">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Teachers</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentTeacher.user_profile_data ? 
                `${currentTeacher.user_profile_data.first_name} ${currentTeacher.user_profile_data.last_name}` : 
                'Teacher Details'
              }
            </h1>
            <p className="text-gray-600 mt-1">Teacher ID: {currentTeacher.employee_id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Teacher Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{currentTeacher.user_profile_data?.first_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{currentTeacher.user_profile_data?.last_name || 'Not provided'}</p>
                </div>
                {currentTeacher.user_profile_data?.other_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Other Name</label>
                    <p className="text-gray-900">{currentTeacher.user_profile_data.other_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </label>
                  <p className="text-gray-900">
                    {typeof currentTeacher.user_profile_data?.user === 'object' && currentTeacher.user_profile_data.user.email 
                      ? currentTeacher.user_profile_data.user.email 
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </label>
                  <p className="text-gray-900">{currentTeacher.user_profile_data?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">
                    {currentTeacher.user_profile_data?.gender ? 
                      (currentTeacher.user_profile_data.gender === 'M' ? 'Male' : 
                       currentTeacher.user_profile_data.gender === 'F' ? 'Female' : 'Other') : 
                      'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date of Birth</span>
                  </label>
                  <p className="text-gray-900">
                    {currentTeacher.user_profile_data?.dob ? 
                      new Date(currentTeacher.user_profile_data.dob).toLocaleDateString() : 
                      'Not provided'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status and Quick Info */}
        <div className="space-y-6">
          {/* Role Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTeacher.user_profile_data?.role ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Role</label>
                    <p className="text-gray-900 font-medium">{currentTeacher.user_profile_data.role.name}</p>
                  </div>
                  {currentTeacher.user_profile_data.role.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role Description</label>
                      <p className="text-gray-900 text-sm">{currentTeacher.user_profile_data.role.description}</p>
                    </div>
                  )}
                  {currentTeacher.user_profile_data.role.permissions && currentTeacher.user_profile_data.role.permissions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Permissions</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {currentTeacher.user_profile_data.role.permissions.map((permission: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No role assigned</p>
                  <p className="text-gray-400 text-xs mt-1">This teacher doesn't have any specific role assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher Type */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Teacher Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${TEACHER_TYPE_COLORS[currentTeacher.employment_type]} border-0 text-sm font-medium`}>
                {TEACHER_TYPE_LABELS[currentTeacher.employment_type]}
              </Badge>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Teacher ID</label>
                <p className="text-gray-900 font-mono">{currentTeacher.employee_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Hire Date</span>
                </label>
                <p className="text-gray-900">
                  {currentTeacher.hire_date ? 
                    new Date(currentTeacher.hire_date).toLocaleDateString() : 
                    'Not provided'
                  }
                </p>
              </div>
              {currentTeacher.salary && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Salary</span>
                  </label>
                  <p className="text-gray-900">${parseFloat(currentTeacher.salary).toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Specialization</span>
                </label>
                <p className="text-gray-900">{currentTeacher.specialization || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Qualifications */}
      {currentTeacher.qualification && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Qualifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 whitespace-pre-line">{currentTeacher.qualification}</p>
          </CardContent>
        </Card>
      )}

      {/* Subject Assignments */}
      {currentTeacher.subject_assignments && currentTeacher.subject_assignments.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Subject Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentTeacher.subject_assignments.map((assignment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subject</label>
                      <p className="text-gray-900">{assignment.subject_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Stream</label>
                      <p className="text-gray-900">{assignment.stream_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Academic Year</label>
                      <p className="text-gray-900">{assignment.academic_year_name || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact Information */}
      {currentTeacher.user_profile_data?.emergency_contact && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-gray-900">{currentTeacher.user_profile_data.emergency_contact}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                <p className="text-gray-900">{currentTeacher.user_profile_data.emergency_phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Email</label>
                <p className="text-gray-900">{currentTeacher.user_profile_data.emergency_contact_email || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 