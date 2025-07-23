'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchClassById, deleteClass, clearCurrentClass } from '@/store/slices/memberClassSlice';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Building, GraduationCap, Users, AlertCircle, Plus } from 'lucide-react';

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
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading class details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
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

  if (!currentClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
        </div>
        <Card className="bg-yellow-50 border border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Class not found</span>
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
          <Link href="/members/classes">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Classes</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentClass.name}</h1>
            <p className="text-gray-600 mt-1">Class Information</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
            onClick={handleDelete}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Class Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Building className="h-5 w-5" />
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
                  <label className="text-sm font-medium text-gray-500">Academic Level</label>
                  <Badge variant="secondary" className="mt-1">
                    {currentClass.name}
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
              <CardTitle className="text-lg font-semibold text-gray-900">Statistics</CardTitle>
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
                <GraduationCap className="h-5 w-5" />
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
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
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
              <GraduationCap className="h-5 w-5" />
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
          <CardTitle className="text-lg font-semibold text-gray-900">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Created</label>
              <p className="text-gray-900">
                {new Date(currentClass.created_at).toLocaleDateString()} at{' '}
                {new Date(currentClass.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">
                {new Date(currentClass.updated_at).toLocaleDateString()} at{' '}
                {new Date(currentClass.updated_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 