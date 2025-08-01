'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchClassById, deleteClass, clearCurrentClass } from '@/store/slices/memberClassSlice';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Building, GraduationCap, Users, AlertCircle, Plus, Activity, FileText, Calendar, Clock } from 'lucide-react';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentClass, loading, error } = useAppSelector((state) => state.memberClasses);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const classId = parseInt(params.id as string);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && classId) {
      dispatch(fetchClassById(classId));
    }

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentClass());
    };
  }, [dispatch, classId, isAuthenticated]);

  const handleEdit = () => {
    router.push(`/members/classes/${classId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await dispatch(deleteClass(classId));
        router.push('/members/classes');
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

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

  if (loading) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
        </div>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Class
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

  if (!currentClass) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
        </div>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Class Not Found
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-yellow-700">The requested class could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Building className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{currentClass.name}</h1>
            <p className="text-indigo-100 text-base sm:text-lg">
              Class Information and Academic Details
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-indigo-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Status: {currentClass.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>{currentClass.streams?.length || 0} Streams</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{currentClass.streams?.reduce((total, stream) => total + (stream.current_enrollment || 0), 0) || 0} Students</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/members/classes"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Classes
            </Link>
            <Button
              onClick={handleEdit}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Edit Class
            </Button>
          </div>
        </div>
      </div>

      {/* Class Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Building className="h-5 w-5 text-indigo-600" />
                <span>Class Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Class Name</label>
                  <p className="text-gray-900 font-medium">{currentClass.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={currentClass.is_active ? 'success' : 'secondary'} className="mt-1">
                    {currentClass.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">
                    {currentClass.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <span>Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Streams</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {currentClass.streams?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Students</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {currentClass.streams?.reduce((total, stream) => total + (stream.current_enrollment || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Streams */}
      {currentClass.streams && currentClass.streams.length > 0 && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                <span>Streams</span>
              </CardTitle>
              <Link href="/members/streams/create">
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Stream</span>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentClass.streams.map((stream, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <h4 className="font-medium text-gray-900">{stream.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {stream.current_enrollment || 0} student{(stream.current_enrollment || 0) !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <Link href={`/members/streams/${stream.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Streams */}
      {(!currentClass.streams || currentClass.streams.length === 0) && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <span>Streams</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No streams found</h3>
              <p className="text-gray-600 mb-4">
                This class doesn&apos;t have any streams yet. Add streams to organize students better.
              </p>
              <Link href="/members/streams/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stream
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Metadata */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span>Metadata</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <label className="font-medium text-gray-500">Created</label>
                <p className="text-gray-900">
                  {new Date(currentClass.created_at).toLocaleDateString()} at{' '}
                  {new Date(currentClass.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <label className="font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">
                  {new Date(currentClass.updated_at).toLocaleDateString()} at{' '}
                  {new Date(currentClass.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 