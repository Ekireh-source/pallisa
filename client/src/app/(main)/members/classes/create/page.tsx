'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createClass, clearFieldErrors } from '@/store/slices/memberClassSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { ClassCreateUpdate } from '@/types';

export default function CreateClassPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.memberClasses);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<ClassCreateUpdate>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const result = await dispatch(createClass(formData));
      if (createClass.fulfilled.match(result)) {
        router.push('/members/classes');
      }
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleCancel = () => {
    router.push('/members/classes');
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
            <h1 className="text-2xl font-bold text-gray-900">Add New Class</h1>
            <p className="text-gray-600 mt-1">Create a new class for Pallisa High School</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Class Information</CardTitle>
          <CardDescription>
            Enter the basic class information for Pallisa High School
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
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
                  placeholder="Enter class name (e.g., Form 1, Grade 8, Senior 1)"
                  required
                />
                {fieldErrors.name && (
                  <p className="text-sm text-red-600">{fieldErrors.name}</p>
                )}
                <p className="text-xs text-gray-500">Name of the class or grade level</p>
              </div>
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
                    <span>Creating Class...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Class</span>
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