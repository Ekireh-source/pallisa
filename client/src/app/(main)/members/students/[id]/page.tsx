'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentById, deleteStudent, clearCurrentStudent, restoreStudent } from '@/store/slices/memberStudentSlice';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, GraduationCap, AlertCircle, Activity, FileText } from 'lucide-react';

const ENROLLMENT_STATUS_COLORS = {
  enrolled: 'bg-green-100 text-green-800',
  transferred: 'bg-blue-100 text-blue-800',
  graduated: 'bg-purple-100 text-purple-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  withdrawn: 'bg-red-100 text-red-800',
};

const ENROLLMENT_STATUS_LABELS = {
  enrolled: 'Enrolled',
  transferred: 'Transferred',
  graduated: 'Graduated',
  suspended: 'Suspended',
  withdrawn: 'Withdrawn',
};

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentStudent, loading, error } = useAppSelector((state) => state.memberStudents);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const studentId = parseInt(params.id as string);
  console.log(currentStudent);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

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

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, studentId, isAuthenticated]);

  const handleEdit = () => {
    router.push(`/members/students/${studentId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteStudent(studentId));
      router.push('/members/students');
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleRestore = async () => {
    try {
      await dispatch(restoreStudent(studentId));
      router.push('/members/students');
    } catch (error) {
      console.error('Error restoring student:', error);
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
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
              href="/members/students"
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Students
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
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
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {currentStudent.user_profile ? 
                `${currentStudent.user_profile.first_name} ${currentStudent.user_profile.last_name}` : 
                'Student Details'
              }
            </h1>
            <p className="text-blue-100 text-lg">Student ID: {currentStudent.student_id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={`${ENROLLMENT_STATUS_COLORS[currentStudent.enrollment_status] || 'bg-gray-100 text-gray-800'} rounded-full`}>
              {ENROLLMENT_STATUS_LABELS[currentStudent.enrollment_status] || currentStudent.enrollment_status}
            </Badge>
            <Link
              href="/members/students"
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Students
            </Link>
          </div>
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
          <div className="flex items-center space-x-3">
            {currentStudent.is_active ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm text-white border-red-500/30 hover:bg-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestoreModal(true)}
                className="flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm text-white border-green-500/30 hover:bg-green-500/30"
              >
                <User className="h-4 w-4" />
                <span>Restore</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Student Information */}
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
                  <p className="text-gray-900">{currentStudent.user_profile_data?.first_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{currentStudent.user_profile_data?.last_name || 'Not provided'}</p>
                </div>
                {currentStudent.user_profile_data?.other_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Other Name</label>
                    <p className="text-gray-900">{currentStudent.user_profile_data.other_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </label>
                  <p className="text-gray-900">
                    {typeof currentStudent.user_profile_data?.user === 'object' && currentStudent.user_profile_data.user.email 
                      ? currentStudent.user_profile_data.user.email 
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number</span>
                  </label>
                  <p className="text-gray-900">{currentStudent.user_profile_data?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">
                    {currentStudent.user_profile_data?.gender ? 
                      (currentStudent.user_profile_data.gender === 'M' ? 'Male' : 
                       currentStudent.user_profile_data.gender === 'F' ? 'Female' : 'Other') : 
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
                    {currentStudent.user_profile_data?.dob ? 
                      new Date(currentStudent.user_profile_data.dob).toLocaleDateString() : 
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
          {/* Enrollment Status */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Enrollment Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${ENROLLMENT_STATUS_COLORS[currentStudent.enrollment_status]} border-0 text-sm font-medium`}>
                {ENROLLMENT_STATUS_LABELS[currentStudent.enrollment_status]}
              </Badge>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Student ID</label>
                <p className="text-gray-900 font-mono">{currentStudent.student_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Stream</label>
                <p className="text-gray-900">
                  {currentStudent.current_stream?.name || 'Not assigned'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admission Number</label>
                <p className="text-gray-900">{currentStudent.admission_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Admission Date</label>
                <p className="text-gray-900">
                  {currentStudent.admission_date ? 
                    new Date(currentStudent.admission_date).toLocaleDateString() : 
                    'Not provided'
                  }
                </p>
              </div>
              {currentStudent.graduation_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Graduation Date</label>
                  <p className="text-gray-900">
                    {new Date(currentStudent.graduation_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency Contact Information */}
      {currentStudent.user_profile?.emergency_contact && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-gray-900">{currentStudent.user_profile.emergency_contact}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                <p className="text-gray-900">{currentStudent.user_profile.emergency_phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Email</label>
                <p className="text-gray-900">{currentStudent.user_profile.emergency_contact_email || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parents Information */}
      {currentStudent.parents && currentStudent.parents.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Parents/Guardians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStudent.parents.map((parentRelation, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{parentRelation.parent_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relationship</label>
                      <p className="text-gray-900 capitalize">{parentRelation.relationship_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Primary Contact</label>
                      <Badge variant={parentRelation.is_primary ? "default" : "secondary"}>
                        {parentRelation.is_primary ? 'Primary' : 'Secondary'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stream History */}
      {currentStudent.stream_history && currentStudent.stream_history.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Stream History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStudent.stream_history.map((history, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Stream</label>
                      <p className="text-gray-900">{history.stream_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Academic Year</label>
                      <p className="text-gray-900">{history.academic_year_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-gray-900">
                        {history.start_date ? new Date(history.start_date).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-gray-900">
                        {history.end_date ? new Date(history.end_date).toLocaleDateString() : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestore}
        title="Confirm Restoration"
        message="Are you sure you want to restore this student?"
        confirmText="Restore"
        cancelText="Cancel"
        variant="success"
      />
    </div>
  );
} 