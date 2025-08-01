'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createParent, clearFieldErrors } from '@/store/slices/memberParentSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, User, Heart, Home, Shield } from 'lucide-react';
import type { ParentCreateUpdate } from '@/types';

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export default function CreateParentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.memberParents);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<ParentCreateUpdate>({
    // User creation fields
    user_email: '',
    // UserProfile creation fields
    user_first_name: '',
    user_last_name: '',
    user_other_name: '',
    user_gender: undefined,
    user_dob: '',
    user_phone: '',
    user_emergency_contact: '',
    user_emergency_phone: '',
    user_emergency_contact_address: '',
    user_emergency_contact_email: '',
    // Parent specific fields
    relationship_type: 'father',
    occupation: '',
    workplace: '',
    work_phone: '',
    home_address: '',
    is_primary_contact: true,
    is_emergency_contact: true,
    is_authorized_pickup: true,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | boolean | undefined = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (value === '') {
      processedValue = undefined;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));

    // Clear field error when user interacts
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty string values
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    try {
      const result = await dispatch(createParent(cleanedData as unknown as ParentCreateUpdate));
      if (createParent.fulfilled.match(result)) {
        router.push('/members/parents');
      }
    } catch (error) {
      console.error('Error creating parent:', error);
    }
  };

  const handleCancel = () => {
    router.push('/members/parents');
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
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Add New Parent/Guardian</h1>
            <p className="text-green-100 text-lg">
              Create a comprehensive parent/guardian record with all required information
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-green-100">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Parent Management</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span className="text-sm">Family Records</span>
            </div>
          </div>
          <Link
            href="/members/parents"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Parents
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <X className="w-5 h-5 mr-2 text-red-600" />
              Error Creating Parent
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

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Basic personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_first_name"
                  name="user_first_name"
                  type="text"
                  value={formData.user_first_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_last_name"
                  name="user_last_name"
                  type="text"
                  value={formData.user_last_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
                {fieldErrors.user_last_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_other_name">Other Name</Label>
                <Input
                  id="user_other_name"
                  name="user_other_name"
                  type="text"
                  value={formData.user_other_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter other name"
                />
                {fieldErrors.user_other_name && (
                  <p className="text-sm text-red-600">{fieldErrors.user_other_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_gender">Gender</Label>
                <select
                  id="user_gender"
                  name="user_gender"
                  value={formData.user_gender || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.user_gender && (
                  <p className="text-sm text-red-600">{fieldErrors.user_gender}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_dob">Date of Birth</Label>
                <Input
                  id="user_dob"
                  name="user_dob"
                  type="date"
                  value={formData.user_dob || ''}
                  onChange={handleInputChange}
                />
                {fieldErrors.user_dob && (
                  <p className="text-sm text-red-600">{fieldErrors.user_dob}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_phone">Phone Number</Label>
                <Input
                  id="user_phone"
                  name="user_phone"
                  type="tel"
                  value={formData.user_phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
                {fieldErrors.user_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.user_phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  value={formData.user_email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                />
                {fieldErrors.user_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship_type">
                  Relationship to Student <span className="text-red-500">*</span>
                </Label>
                <select
                  id="relationship_type"
                  name="relationship_type"
                  value={formData.relationship_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {RELATIONSHIP_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.relationship_type && (
                  <p className="text-sm text-red-600">{fieldErrors.relationship_type}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-green-600" />
              <span>Relationship Information</span>
            </CardTitle>
            <CardDescription>
              Define the relationship type and family connection details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact">Emergency Contact Name</Label>
                <Input
                  id="user_emergency_contact"
                  name="user_emergency_contact"
                  type="text"
                  value={formData.user_emergency_contact || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                />
                {fieldErrors.user_emergency_contact && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="user_emergency_phone"
                  name="user_emergency_phone"
                  type="tel"
                  value={formData.user_emergency_phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact phone"
                />
                {fieldErrors.user_emergency_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact_email">Emergency Contact Email</Label>
                <Input
                  id="user_emergency_contact_email"
                  name="user_emergency_contact_email"
                  type="email"
                  value={formData.user_emergency_contact_email || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact email"
                />
                {fieldErrors.user_emergency_contact_email && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_emergency_contact_address">Emergency Contact Address</Label>
                <Input
                  id="user_emergency_contact_address"
                  name="user_emergency_contact_address"
                  type="text"
                  value={formData.user_emergency_contact_address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact address"
                />
                {fieldErrors.user_emergency_contact_address && (
                  <p className="text-sm text-red-600">{fieldErrors.user_emergency_contact_address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Home className="h-5 w-5 text-green-600" />
              <span>Work Information</span>
            </CardTitle>
            <CardDescription>
              Professional details and workplace information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={formData.occupation || ''}
                  onChange={handleInputChange}
                  placeholder="Enter occupation"
                />
                {fieldErrors.occupation && (
                  <p className="text-sm text-red-600">{fieldErrors.occupation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workplace">Workplace</Label>
                <Input
                  id="workplace"
                  name="workplace"
                  type="text"
                  value={formData.workplace || ''}
                  onChange={handleInputChange}
                  placeholder="Enter workplace/company name"
                />
                {fieldErrors.workplace && (
                  <p className="text-sm text-red-600">{fieldErrors.workplace}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="work_phone">Work Phone</Label>
                <Input
                  id="work_phone"
                  name="work_phone"
                  type="tel"
                  value={formData.work_phone || ''}
                  onChange={handleInputChange}
                  placeholder="Enter work phone number"
                />
                {fieldErrors.work_phone && (
                  <p className="text-sm text-red-600">{fieldErrors.work_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="home_address">Home Address</Label>
                <Input
                  id="home_address"
                  name="home_address"
                  type="text"
                  value={formData.home_address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter home address"
                />
                {fieldErrors.home_address && (
                  <p className="text-sm text-red-600">{fieldErrors.home_address}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions & Access Rights */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Permissions & Access Rights</span>
            </CardTitle>
            <CardDescription>
              Define the access rights and permissions for this parent/guardian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_primary_contact"
                  checked={formData.is_primary_contact || false}
                  onChange={(e) => handleCheckboxChange('is_primary_contact', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <Label htmlFor="is_primary_contact" className="text-sm font-medium">
                    Primary Contact
                  </Label>
                  <p className="text-xs text-gray-500">School&apos;s first point of contact</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_emergency_contact"
                  checked={formData.is_emergency_contact || false}
                  onChange={(e) => handleCheckboxChange('is_emergency_contact', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <Label htmlFor="is_emergency_contact" className="text-sm font-medium">
                    Emergency Contact
                  </Label>
                  <p className="text-xs text-gray-500">Can be contacted in emergencies</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_authorized_pickup"
                  checked={formData.is_authorized_pickup || false}
                  onChange={(e) => handleCheckboxChange('is_authorized_pickup', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <Label htmlFor="is_authorized_pickup" className="text-sm font-medium">
                    Authorized Pickup
                  </Label>
                  <p className="text-xs text-gray-500">Authorized to pick up student</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-end space-x-4">
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
                    <span>Creating Parent...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Parent</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
} 