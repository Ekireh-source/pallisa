'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createStream, clearFieldErrors } from '@/store/slices/memberStreamSlice';
import { fetchClasses } from '@/store/slices/memberClassSlice';
import { fetchTeachers } from '@/store/slices/memberTeacherSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, GitBranch } from 'lucide-react';
import type { StreamCreateUpdate } from '@/types';

export default function CreateStreamPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.memberStreams);
  const { classes, loading: classesLoading } = useAppSelector((state) => state.memberClasses);
  const { teachers, loading: teachersLoading } = useAppSelector((state) => state.memberTeachers);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<StreamCreateUpdate>({
    class_obj: undefined,
    name: '',
    class_teacher: undefined,
    capacity: 30,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch required data
    dispatch(fetchClasses({}));
    dispatch(fetchTeachers({}));
  }, [isAuthenticated, router, dispatch]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? (value ? parseInt(value, 10) : undefined) : value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSelectChange = (field: keyof StreamCreateUpdate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? parseInt(value, 10) : undefined
    }));

    // Clear field error when user makes a selection
    if (fieldErrors[field]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.class_obj || !formData.name) {
      return;
    }
    
    try {
      const result = await dispatch(createStream(formData));
      if (createStream.fulfilled.match(result)) {
        router.push('/members/streams');
      }
    } catch (error) {
      console.error('Error creating stream:', error);
    }
  };

  const handleCancel = () => {
    router.push('/members/streams');
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
          <Link href="/members/streams">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Streams</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Stream</h1>
            <p className="text-gray-600 mt-1">Set up a new academic stream for Pallisa High School</p>
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
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Stream Information</span>
          </CardTitle>
          <CardDescription>
            Enter stream details and select the class it belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="class_obj">
                  Class <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.class_obj?.toString() || ''}
                  onValueChange={(value) => handleSelectChange('class_obj', value)}
                  disabled={classesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={classesLoading ? 'Loading classes...' : 'Select a class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.class_obj && (
                  <p className="text-sm text-red-600">{fieldErrors.class_obj}</p>
                )}
                <p className="text-xs text-gray-500">Select the class this stream belongs to</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Stream Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter stream name (e.g., Form 1A, Grade 8 East)"
                  required
                />
                {fieldErrors.name && (
                  <p className="text-sm text-red-600">{fieldErrors.name}</p>
                )}
                <p className="text-xs text-gray-500">Unique name for this stream</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  placeholder="Enter student capacity"
                  required
                />
                {fieldErrors.capacity && (
                  <p className="text-sm text-red-600">{fieldErrors.capacity}</p>
                )}
                <p className="text-xs text-gray-500">Maximum number of students for this stream</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_teacher">
                  Class Teacher (Optional)
                </Label>
                <Select
                  value={formData.class_teacher?.toString() || ''}
                  onValueChange={(value) => handleSelectChange('class_teacher', value)}
                  disabled={teachersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={teachersLoading ? 'Loading teachers...' : 'Select class teacher (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.teacher_name || 'Unknown Teacher'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.class_teacher && (
                  <p className="text-sm text-red-600">{fieldErrors.class_teacher}</p>
                )}
                <p className="text-xs text-gray-500">Assign a primary class teacher</p>
              </div>
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
                disabled={loading || !formData.class_obj || !formData.name.trim()}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating Stream...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Stream</span>
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