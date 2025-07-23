'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchClasses, deleteClass } from '@/store/slices/memberClassSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { 
  Search, 
  Building,
  GraduationCap,
  Plus,
  Trash2,
  Eye,
  Edit
} from 'lucide-react';
import type { MemberClass } from '@/types';

export default function ClassesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { classes, loading, error, totalCount } = useAppSelector((state) => state.memberClasses);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
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
      dispatch(fetchClasses({
        page: currentPage,
        search: searchTerm,
      }));
    }
  }, [dispatch, currentPage, searchTerm, isAuthenticated]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await dispatch(deleteClass(id));
        // Refresh the list
        dispatch(fetchClasses({
          page: currentPage,
          search: searchTerm,
        }));
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Pallisa High School Classes</h1>
          <p className="text-gray-600 mt-1">Manage class levels and academic structure for Pallisa High School</p>
        </div>
        <Link href="/members/classes/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add New Class</span>
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Pallisa High School classes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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

      {/* Classes List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Pallisa High School Classes ({totalCount})</span>
          </CardTitle>
          <CardDescription>
            Manage academic class levels for Pallisa High School
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Loading classes...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'No classes match your current search.'
                  : 'Get started by adding your first class.'}
              </p>
              {!searchTerm && (
                <Link href="/members/classes/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem: MemberClass) => (
                <div
                  key={classItem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{classItem.name}</h3>
                            <Badge variant={classItem.is_active ? 'success' : 'secondary'}>
                              {classItem.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <GraduationCap className="h-4 w-4" />
                              <span>{classItem.stream_count} stream{classItem.stream_count !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <span className="text-xs text-gray-500">Created: {new Date(classItem.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {classItem.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{classItem.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/members/classes/${classItem.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/members/classes/${classItem.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(classItem.id)}
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
    </div>
  );
} 