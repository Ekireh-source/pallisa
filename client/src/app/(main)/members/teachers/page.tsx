'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchTeachers, deleteTeacher } from '@/store/slices/memberTeacherSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { Plus, Search, Edit, Trash2, Eye, Mail, UserCheck, Calendar } from 'lucide-react';
import type { MemberTeacher } from '@/types';

const TEACHER_TYPE_COLORS = {
  full_time: 'bg-green-100 text-green-800',
  contract: 'bg-blue-100 text-blue-800',
  substitute: 'bg-yellow-100 text-yellow-800',
  part_time: 'bg-purple-100 text-purple-800',
  volunteer: 'bg-gray-100 text-gray-800',
};

const TEACHER_TYPE_LABELS = {
  full_time: 'Full Time',
  contract: 'Contract',
  substitute: 'Substitute',
  part_time: 'Part Time',
  volunteer: 'Volunteer',
};

export default function TeachersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { teachers, loading, error, totalCount } = useAppSelector((state) => state.memberTeachers);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<number | null>(null);

  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTeachers({
        page: currentPage,
        search: searchTerm,
        employment_type: selectedType,
      }));
    }
  }, [dispatch, currentPage, searchTerm, selectedType, isAuthenticated]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    setTeacherToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await dispatch(deleteTeacher(teacherToDelete));
        // Refresh the list
        dispatch(fetchTeachers({
          page: currentPage,
          search: searchTerm,
          employment_type: selectedType,
        }));
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pallisa High School Teachers</h1>
          <p className="text-gray-600 mt-1">Manage teaching staff records and information for Pallisa High School</p>
        </div>
        <Link href="/members/teachers/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add New Teacher</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Pallisa High School teachers..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedType}
                onChange={handleTypeFilter}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employment Types</option>
                <option value="full_time">Full Time</option>
                <option value="contract">Contract</option>
                <option value="substitute">Substitute</option>
                <option value="part_time">Part Time</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Pallisa High School Teaching Staff ({totalCount})</span>
          </CardTitle>
          <CardDescription>
            Manage and monitor teaching staff information and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Loading teaching staff...</span>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType
                  ? 'No teachers match your current search criteria.'
                  : 'Get started by adding teaching staff to Pallisa High School.'}
              </p>
              {!searchTerm && !selectedType && (
                <Link href="/members/teachers/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Teacher
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {teachers.map((teacher: MemberTeacher) => (
                <div
                  key={teacher.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {teacher.teacher_name || 'Unknown Teacher'}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <span className="font-medium">ID:</span>
                              <span className="font-mono">{teacher.employee_id}</span>
                            </div>
                            {teacher.user_email && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span>{teacher.user_email}</span>
                              </div>
                            )}
                            {teacher.specialization && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <span className="font-medium">Subject:</span>
                                <span>{teacher.specialization}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={`${TEACHER_TYPE_COLORS[teacher.employment_type]} border-0 text-sm font-medium`}>
                              {TEACHER_TYPE_LABELS[teacher.employment_type]}
                            </Badge>
                            {(teacher as MemberTeacher & { user_profile_data?: { role?: { name: string } } })?.user_profile_data?.role && (
                              <Badge className="bg-purple-100 text-purple-800 border-0 text-sm font-medium">
                                {(teacher as MemberTeacher & { user_profile_data?: { role?: { name: string } } })?.user_profile_data?.role?.name}
                              </Badge>
                            )}
                            {teacher.hire_date && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Hired: {new Date(teacher.hire_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/members/teachers/${teacher.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/members/teachers/${teacher.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 