'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchNonStaffMemberById, deleteNonStaffMember } from '@/store/slices/memberNonStaffSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, User, Briefcase, Heart, Calendar, DollarSign, Award, Phone, Mail, MapPin, Shield, AlertCircle } from 'lucide-react';
import type { NonStaffMember } from '@/types';
import type { UserProfile, Role, Permission } from '@/types';

interface NonStaffMemberWithProfile extends NonStaffMember {
  user_profile_data?: UserProfile & { role?: Role };
}

export default function NonStaffMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentNonStaffMember, loading, error } = useAppSelector((state) => state.memberNonStaff);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const nonStaffMemberId = params.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (nonStaffMemberId) {
      dispatch(fetchNonStaffMemberById(nonStaffMemberId));
    }
  }, [isAuthenticated, router, dispatch, nonStaffMemberId]);

  const handleEdit = () => {
    if (nonStaffMemberId) {
      router.push(`/members/non-staff-members/${nonStaffMemberId}/edit`);
    }
  };

  const handleDelete = async () => {
    if (nonStaffMemberId) {
      try {
        await dispatch(deleteNonStaffMember(nonStaffMemberId));
        router.push('/members/non-staff-members');
      } catch (error) {
        console.error('Error deleting non-staff member:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEmploymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'full_time': 'Full Time',
      'part_time': 'Part Time',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'volunteer': 'Volunteer'
    };
    return types[type] || type;
  };

  const getGenderLabel = (gender: string) => {
    const genders: Record<string, string> = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };
    return genders[gender] || gender;
  };

  function getFullName(profile?: UserProfile): string {
    if (!profile) return 'N/A';
    return [profile.first_name, profile.other_name, profile.last_name].filter(Boolean).join(' ') || 'N/A';
  }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Member</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/members/non-staff-members">
            <Button className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Members</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentNonStaffMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Not Found</h3>
          <p className="text-gray-600 mb-6">The requested member could not be found.</p>
          <Link href="/members/non-staff-members">
            <Button className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Members</span>
            </Button>
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
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {currentNonStaffMember.full_name || 'Unknown Member'}
            </h1>
            <p className="text-purple-100 text-lg">
              Non-Staff Member • {getEmploymentTypeLabel(currentNonStaffMember.employment_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-purple-100">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">Employee ID: {currentNonStaffMember.employee_id}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Hired: {currentNonStaffMember.hire_date ? formatDate(currentNonStaffMember.hire_date) : 'Not specified'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleEdit}
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Member
            </Button>
            <Link href="/members/non-staff-members">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Members
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
              <CardDescription>
                Are you sure you want to delete this non-staff member? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium">
                    {currentNonStaffMember.full_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="text-gray-900 font-medium">{currentNonStaffMember.employee_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Role Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No role information available</p>
                <p className="text-gray-400 text-xs mt-1">Role details are not included in the current data structure</p>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span>Employment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Employment Type</label>
                  <p className="text-gray-900 font-medium">{getEmploymentTypeLabel(currentNonStaffMember.employment_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hire Date</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {currentNonStaffMember.hire_date ? formatDate(String(currentNonStaffMember.hire_date)) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Qualification</label>
                  <p className="text-gray-900 flex items-center">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    {currentNonStaffMember.qualification || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Specialization</label>
                  <p className="text-gray-900">{currentNonStaffMember.specialization || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                  <p className="text-gray-900">{currentNonStaffMember.years_of_experience || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary</label>
                  <p className="text-gray-900 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Salary: UGX {currentNonStaffMember.salary ? Number(currentNonStaffMember.salary).toLocaleString() : '-'}</span>
                  </p>
                </div>
              </div>

              {currentNonStaffMember.previous_experience && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Previous Experience</label>
                  <p className="text-gray-900 mt-1">{currentNonStaffMember.previous_experience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact Information */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-600" />
                <span>Emergency Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Name</label>
                  <p className="text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Address</label>
                  <p className="text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    N/A
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Active Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentNonStaffMember.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentNonStaffMember.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900 text-sm">{formatDate(currentNonStaffMember.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 text-sm">{formatDate(currentNonStaffMember.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleEdit} className="w-full justify-start">
                <Edit className="h-4 w-4 mr-2" />
                Edit Non-Staff Member
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Non-Staff Member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 