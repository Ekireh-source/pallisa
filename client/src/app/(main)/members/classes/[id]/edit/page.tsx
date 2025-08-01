'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchClassById, updateClass, clearFieldErrors, clearCurrentClass } from '@/store/slices/memberClassSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, Building, GraduationCap } from 'lucide-react';
import type { ClassCreateUpdate } from '@/types';

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentClass, loading, error, fieldErrors } = useAppSelector((state) => state.memberClasses);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const classId = parseInt(params.id as string);

  const [formData, setFormData] = useState<ClassCreateUpdate>({
    name: '',
    description: '',
  });

  const [isFormLoaded, setIsFormLoaded] = useState(false);

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

    // Clear field errors when component mounts
    dispatch(clearFieldErrors());

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentClass());
    };
  }, [dispatch, classId, isAuthenticated]);

  // Update form data when class data is loaded
  useEffect(() => {
    if (currentClass && !isFormLoaded) {
      setFormData({
        name: currentClass.name,
        description: currentClass.description || '',
      });
      setIsFormLoaded(true);
    }
  }, [currentClass, isFormLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(updateClass({ id: classId, data: formData }));
      if (updateClass.fulfilled.match(result)) {
        router.push(`/members/classes/${classId}`);
      }
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/members/classes/${classId}`);
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

  if (loading && !currentClass) {
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

  if (error && !currentClass) {
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
              <X className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Class
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
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
              <X className="w-5 h-5 mr-2 text-yellow-600" />
              Class Not Found
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-yellow-700">The requested class could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Class</h1>
            <p className="text-indigo-100 text-lg">
              Update class information for {currentClass.name}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-indigo-100">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">Class Management</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm">Academic Structure</span>
            </div>
          </div>
          <Link
            href={`/members/classes/${classId}`}
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Details
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <X className="w-5 h-5 mr-2 text-red-600" />
              Error Updating Class
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <span>Class Information</span>
          </CardTitle>
          <CardDescription>
            Update the class details and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Class Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter class name (e.g., Form 1, Grade 8)"
                required
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter class description and any additional information..."
                rows={3}
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span>Updating Class...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Class</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 