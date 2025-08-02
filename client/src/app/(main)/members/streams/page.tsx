'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStreams, deleteStream } from '@/store/slices/memberStreamSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  GitBranch, 
  Users, 
  GraduationCap,
  Activity,
  FileText,
  AlertCircle,
  Filter,
  RefreshCw,
  Upload
} from 'lucide-react';

export default function StreamsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { streams, loading, error } = useAppSelector((state) => state.memberStreams);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState<{ id: number; name: string } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch streams
    dispatch(fetchStreams({}));
  }, [isAuthenticated, router, dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number, name: string) => {
    setStreamToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (streamToDelete) {
      try {
        await dispatch(deleteStream(streamToDelete.id));
        // Refresh the list
        dispatch(fetchStreams({}));
      } catch (error) {
        console.error('Error deleting stream:', error);
      }
    }
    setDeleteModalOpen(false);
    setStreamToDelete(null);
  };

  // Filter streams based on search term
  const filteredStreams = streams.filter(stream =>
    stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.class_obj_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = filteredStreams.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStreams = filteredStreams.slice(startIndex, startIndex + itemsPerPage);

  const clearAllFilters = () => {
    setSearchTerm('');
    setShowFilters(false);
    setCurrentPage(1);
  };

  // Calculate statistics
  const totalStreams = streams.length;
  const activeStreams = streams.filter(stream => stream.is_active).length;
  const totalStudents = streams.reduce((sum, stream) => sum + (stream.current_enrollment || 0), 0);
  const averageEnrollment = totalStreams > 0 ? Math.round(totalStudents / totalStreams) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <GitBranch className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Pallisa High School Streams</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Manage academic streams and class divisions
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Total: {totalStreams}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Active: {activeStreams}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Students: {totalStudents}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Button
              onClick={() => {/* TODO: Add bulk upload functionality */}}
              disabled={loading}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Bulk Upload
            </Button>
            <Link
              href="/members/streams/create"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Stream
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Streams
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{totalStreams}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                All Streams
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Streams
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{activeStreams}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                Currently Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Students
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{totalStudents}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Enrolled
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Avg Enrollment
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{averageEnrollment}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Per Stream
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span>Search Streams</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find streams by name or class
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch(fetchStreams({}));
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search Pallisa High School streams..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button onClick={() => {/* TODO: Implement search */}} className="flex items-center space-x-2 w-full sm:w-auto">
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
                      Status Filter
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Streams</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
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
                      <span>Clear All Filters</span>
                    </Button>
                  </div>
                  <Button
                    onClick={() => {/* TODO: Apply filters */}}
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

      {/* Streams Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Pallisa High School Streams ({totalCount})</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage stream divisions for different academic tracks at Pallisa High School
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Streams</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => dispatch(fetchStreams({}))}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            </div>
          ) : paginatedStreams.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? 'No streams found matching your criteria' 
                  : 'No streams found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating academic streams for different class divisions'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <span>Clear Search</span>
                  </Button>
                )}
                {!searchTerm && (
                  <Link href="/members/streams/create" className="w-full sm:w-auto">
                    <Button className="flex items-center space-x-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      <span>Add First Stream</span>
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
                      Stream
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Class
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Students
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Teacher
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStreams.map((stream) => (
                    <tr key={stream.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">
                              {stream.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {stream.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Academic Stream
                            </div>
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              Class: {stream.class_obj_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {stream.class_obj_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {stream.current_enrollment || 0}/{stream.capacity || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {stream.class_teacher_name || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden xl:table-cell">
                        <Badge variant={stream.is_active ? 'success' : 'secondary'}>
                          {stream.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/members/streams/${stream.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/members/streams/${stream.id}/edit`)}
                            className="flex items-center space-x-1 px-2 py-1 h-8"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(stream.id, stream.name)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6 px-4 sm:px-6">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} streams
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Stream"
        message={`Are you sure you want to delete the stream "${streamToDelete?.name}"? This action cannot be undone and will permanently remove the stream record.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 