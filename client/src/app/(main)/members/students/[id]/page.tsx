'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentById, deleteStudent, clearCurrentStudent, restoreStudent } from '@/store/slices/memberStudentSlice';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Calendar, GraduationCap, AlertCircle } from 'lucide-react';

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

  if (error) {
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
              <AlertCircle className="h-5 w-5" />
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
              <AlertCircle className="h-5 w-5" />
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
          <Link href="/members/students">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Students</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStudent.user_profile ? 
                `${currentStudent.user_profile.first_name} ${currentStudent.user_profile.last_name}` : 
                'Student Details'
              }
            </h1>
            <p className="text-gray-600 mt-1">Student ID: {currentStudent.student_id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {currentStudent.is_active ? (
            <>
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
            </>
          ) : (
            <>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Inactive
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRestoreModal(true)}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Restore</span>
              </Button>
            </>
          )}
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