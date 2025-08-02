'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { 
  fetchStudents, 
  deleteStudent, 
  fetchStudentStatistics 
} from '@/store/slices/memberStudentSlice';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  LoadingSpinner, 
  ConfirmationModal 
} from '@/components/ui';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Edit, 
  Trash2, 
  Eye, 
  Activity, 
  FileText,
 
  RefreshCw
} from 'lucide-react';
import type { MemberFilters } from '@/types';

const ENROLLMENT_STATUS_COLORS = {
  enrolled: 'bg-green-100 text-green-800',
  transferred: 'bg-orange-100 text-orange-800',
  graduated: 'bg-purple-100 text-purple-800',
  suspended: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
};

const ENROLLMENT_STATUS_LABELS = {
  enrolled: 'Enrolled',
  transferred: 'Transferred',
  graduated: 'Graduated',
  suspended: 'Suspended',
  withdrawn: 'Withdrawn',
};

export default function StudentsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { students, loading, statistics } = useAppSelector((state) => state.memberStudents);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [streamFilter, setStreamFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  
  // State for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Load initial data
    dispatch(fetchStudents({}));
    dispatch(fetchStudentStatistics());
  }, [dispatch, isAuthenticated, router]);

  const handleSearch = () => {
    const filters: MemberFilters = {};
    if (statusFilter) filters.enrollment_status = statusFilter;
    if (streamFilter) filters.stream = parseInt(streamFilter);
    if (searchTerm) filters.search = searchTerm;
    if (showInactive) filters.include_inactive = true;

    dispatch(fetchStudents(filters));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStreamFilter('');
    setShowInactive(false);
    setShowFilters(false);
    dispatch(fetchStudents({}));
  };

  const handleDeleteClick = (studentId: number) => {
    setStudentToDelete(studentId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      try {
        const result = await dispatch(deleteStudent(studentToDelete));
        if (deleteStudent.fulfilled.match(result)) {
          // Refresh the list
          dispatch(fetchStudents({}));
          dispatch(fetchStudentStatistics());
        }
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Student Management</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Manage student records, enrollment status, and academic information
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Total: {statistics?.total_students || 0}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Enrolled: {statistics?.enrolled || 0}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Active: {statistics?.enrolled || 0}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/members/students/create"
              onClick={() => console.log('Add Student button clicked')}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/25 text-white rounded-xl font-semibold hover:bg-white/35 transition-all duration-300 transform hover:scale-105 shadow-lg relative z-10 cursor-pointer border border-white/30 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Students
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{statistics.total_students}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  All Students
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Currently Enrolled
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{statistics.enrolled}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Graduated
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{statistics.graduated}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Completed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Transferred
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{statistics.transferred}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  Moved
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span>Search Students</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find students by name, ID, or other criteria
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                {showFilters ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Filter className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Show'} Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch(fetchStudents({}));
                  dispatch(fetchStudentStatistics());
                }}
                className="flex items-center space-x-2 text-xs sm:text-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, student ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enrollment Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stream
                    </label>
                    <select
                      value={streamFilter}
                      onChange={(e) => setStreamFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Streams</option>
                      {/* Add stream options here */}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showInactive"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="showInactive" className="text-sm font-medium text-gray-700">
                      Show Inactive Students
                    </label>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear All Filters</span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Students ({students.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage student records and view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter || streamFilter || showInactive 
                  ? 'No students found matching your criteria' 
                  : 'No students found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || streamFilter || showInactive 
                  ? 'Try adjusting your search criteria or filters'
                  : 'Get started by adding your first student'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {(searchTerm || statusFilter || streamFilter || showInactive) && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
                {!(searchTerm || statusFilter || streamFilter || showInactive) && (
                  <Link href="/members/students/create" className="w-full sm:w-auto">
                    <Button className="flex items-center space-x-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      <span>Add First Student</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Student ID
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Stream
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Phone
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">
                              {student.full_name?.charAt(0) || student.student_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {student.full_name || student.student_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {student.age ? `${student.age} years old` : 'Age not specified'}
                            </div>
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              ID: {student.student_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden md:table-cell">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {student.student_id}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {student.current_stream_name || 'Not Assigned'}
                        </div>
                        {student.class_name && (
                          <div className="text-xs text-gray-500 truncate">
                            {student.class_name}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ENROLLMENT_STATUS_COLORS[student.enrollment_status]}`}>
                          {ENROLLMENT_STATUS_LABELS[student.enrollment_status]}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {student.user_email || student.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {student.user_profile_data?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/members/students/${student.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Link href={`/members/students/${student.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(student.id)}
                            className="flex items-center space-x-1 px-2 py-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone and will permanently remove the student record."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 