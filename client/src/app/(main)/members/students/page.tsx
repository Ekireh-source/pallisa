'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudents, deleteStudent, fetchStudentStatistics } from '@/store/slices/memberStudentSlice';
import { fetchStreams } from '@/store/slices/memberStreamSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  RefreshCw,
  GraduationCap,
  Users,
  UserCheck,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import type { MemberFilters } from '@/types';

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

export default function StudentsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { students, statistics, loading, error } = useAppSelector((state) => state.memberStudents);
  const { streams, loading: streamsLoading } = useAppSelector((state) => state.memberStreams);

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);

  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [streamFilter, setStreamFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [sortBy] = useState<'name' | 'student_id' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const filters: MemberFilters = {};
      if (statusFilter) filters.enrollment_status = statusFilter;
      if (streamFilter) filters.stream = parseInt(streamFilter);
      if (searchTerm) filters.search = searchTerm;
      if (showInactive) filters.include_inactive = true;
      
      dispatch(fetchStudents(filters));
      dispatch(fetchStudentStatistics());
      dispatch(fetchStreams({}));
    }
  }, [dispatch, isAuthenticated, statusFilter, streamFilter, searchTerm, showInactive]);

  const handleDelete = (studentId: number) => {
    setStudentToDelete(studentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await dispatch(deleteStudent(studentToDelete));
        setShowDeleteModal(false);
        setStudentToDelete(null);
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleRefresh = () => {
    const filters: MemberFilters = {};
    if (statusFilter) filters.enrollment_status = statusFilter;
    if (streamFilter) filters.stream = parseInt(streamFilter);
    if (searchTerm) filters.search = searchTerm;
    dispatch(fetchStudents(filters));
  };

  const filteredAndSortedStudents = React.useMemo(() => {
    // Ensure students is always an array
    if (!Array.isArray(students)) {
      return [];
    }
    
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(student => student.enrollment_status === statusFilter);
    }

    // Apply stream filter
    if (streamFilter) {
      filtered = filtered.filter(student => student.current_stream?.toString() === streamFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'name':
          aValue = a.student_name || '';
          bValue = b.student_name || '';
          break;
        case 'student_id':
          aValue = a.student_id;
          bValue = b.student_id;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [students, searchTerm, statusFilter, streamFilter, sortBy, sortOrder]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: statistics?.total_students || (Array.isArray(students) ? students.length : 0),
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Enrolled",
      value: statistics?.enrolled || (Array.isArray(students) ? students.filter(s => s.enrollment_status === 'enrolled').length : 0),
      icon: UserCheck,
      color: "text-green-600"
    },
    {
      title: "Graduated",
      value: statistics?.graduated || (Array.isArray(students) ? students.filter(s => s.enrollment_status === 'graduated').length : 0),
      icon: GraduationCap,
      color: "text-purple-600"
    },
    {
      title: "Inactive",
      value: (statistics?.suspended || 0) + (statistics?.withdrawn || 0) || 
            (Array.isArray(students) ? students.filter(s => ['suspended', 'withdrawn'].includes(s.enrollment_status)).length : 0),
      icon: AlertCircle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pallisa High School Students</h1>
          <p className="text-gray-600 mt-1">Manage student enrollment, records and academic information</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Student Data</span>
          </Button>
          <Link href="/members/students/create">
            <Button size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Enroll Student</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Pallisa High School students by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Enrollment Status</option>
                <option value="enrolled">Currently Enrolled</option>
                <option value="transferred">Transferred</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={streamsLoading}
              >
                <option value="">All Streams</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name} - {stream.class_obj_name}
                  </option>
                ))}
              </select>
              <Button
                variant={showInactive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
                className="flex items-center space-x-1"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{showInactive ? 'Hide' : 'Show'} Inactive</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Pallisa High School Student Registry ({filteredAndSortedStudents.length})
          </CardTitle>
          <CardDescription>
            {searchTerm || statusFilter || streamFilter ? 'Filtered student records' : 'Complete student registry for Pallisa High School'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter || streamFilter ? 'Try adjusting your search or filters' : 'Get started by adding your first student'}
              </p>
              <Link href="/members/students/create">
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Stream</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Joined</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStudents.map((student) => (
                    <tr key={student.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!student.is_active ? 'bg-gray-50 opacity-75' : ''}`}>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span>{student.student_name || 'Unknown'}</span>
                            {!student.is_active && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.user_email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm">{student.student_id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${ENROLLMENT_STATUS_COLORS[student.enrollment_status]} border-0`}>
                          {ENROLLMENT_STATUS_LABELS[student.enrollment_status]}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {student.current_stream_name || 'Not assigned'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(student.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/members/students/${student.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/members/students/${student.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete student with ID ${studentToDelete}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 