'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchNonStaffMemberById, deleteNonStaffMember } from '@/store/slices/memberNonStaffSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, User, Briefcase, Heart, Calendar, DollarSign, Award, Phone, Mail, MapPin, Shield } from 'lucide-react';
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
          <LoadingSpinner className="h-12 w-12 mx-auto" />
          <p className="mt-4 text-gray-600">Loading non-staff member details...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <p className="text-gray-600 mb-6">The non-staff member you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/members/non-staff-members">
            <Button variant="outline">Back to Non-Staff Members</Button>
          </Link>
        </div>
      </div>
    );
  }

  const member = currentNonStaffMember as NonStaffMemberWithProfile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/members/non-staff-members">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Non-Staff Members</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Non-Staff Member Details</h1>
            <p className="text-gray-600 mt-1">View comprehensive information about this non-staff member</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleEdit} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
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
                    {getFullName(member.user_profile_data)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="text-gray-900 font-medium">{member.employee_id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {typeof member.user_profile_data?.user === 'object' && member.user_profile_data.user?.email ? member.user_profile_data.user.email : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {member.user_profile_data?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">{getGenderLabel(member.user_profile_data?.gender || '') || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {member.user_profile_data?.dob ? formatDate(member.user_profile_data.dob) : 'N/A'}
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
              {member.user_profile_data?.role ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Role</label>
                    <p className="text-gray-900 font-medium">{member.user_profile_data.role.name}</p>
                  </div>
                  {member.user_profile_data.role.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role Description</label>
                      <p className="text-gray-900 text-sm">{member.user_profile_data.role.description}</p>
                    </div>
                  )}
                  {member.user_profile_data.role.permissions && member.user_profile_data.role.permissions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Permissions</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {member.user_profile_data.role.permissions.map((permission: Permission, index: number) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {permission.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No role assigned</p>
                  <p className="text-gray-400 text-xs mt-1">This staff member doesn&apos;t have any specific role assigned</p>
                </div>
              )}
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
                  <p className="text-gray-900 font-medium">{getEmploymentTypeLabel(member.employment_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Hire Date</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(String(member.hire_date ?? ''))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Qualification</label>
                  <p className="text-gray-900 flex items-center">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    {member.qualification || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Specialization</label>
                  <p className="text-gray-900">{member.specialization || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                  <p className="text-gray-900">{member.years_of_experience || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary</label>
                  <p className="text-gray-900 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Salary: UGX {member.salary ? Number(member.salary).toLocaleString() : '-'}</span>
                  </p>
                </div>
              </div>

              {member.previous_experience && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Previous Experience</label>
                  <p className="text-gray-900 mt-1">{member.previous_experience}</p>
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
                  <p className="text-gray-900">{member.user_profile_data?.emergency_contact || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {member.user_profile_data?.emergency_phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {member.user_profile_data?.emergency_contact_email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact Address</label>
                  <p className="text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {member.user_profile_data?.emergency_contact_address || 'N/A'}
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
                      member.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900 text-sm">{formatDate(member.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 text-sm">{formatDate(member.updated_at)}</p>
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