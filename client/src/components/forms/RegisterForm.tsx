'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearFieldError } from '@/store/slices/authSlice';
import { RegisterData } from '@/types';
import { Input, Button, ErrorMessage, Card, Label } from '@/components/ui';

const RegisterForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'school_owner'
  });

  const [schoolData, setSchoolData] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_website: '',
    campus_name: '',
    campus_address: '',
    campus_phone: ''
  });

  const showSchoolFields = formData.user_type === 'school_owner';

  const userTypeOptions = [
    { value: 'school_owner', label: 'School Owner' },
    { value: 'staff', label: 'Staff Member' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name));
    }
  };

  const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSchoolData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      return false;
    }

    if (formData.password.length < 8) {
      return false;
    }

    if (showSchoolFields && !schoolData.school_name) {
      return false;
    }

    return true;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const registerData: RegisterData = {
      ...formData,
      ...(showSchoolFields && { school_data: schoolData })
    };

    try {
      await dispatch(registerUser(registerData));
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Pallisa High School Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
                {getFieldError('first_name') && (
                  <p className="text-sm text-red-600">{getFieldError('first_name')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
                {getFieldError('last_name') && (
                  <p className="text-sm text-red-600">{getFieldError('last_name')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
              {getFieldError('email') && (
                <p className="text-sm text-red-600">{getFieldError('email')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
              />
              {getFieldError('password') && (
                <p className="text-sm text-red-600">{getFieldError('password')}</p>
              )}
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {getFieldError('phone') && (
                <p className="text-sm text-red-600">{getFieldError('phone')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <select
                name="user_type"
                required
                value={formData.user_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {userTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {getFieldError('user_type') && (
                <p className="text-sm text-red-600">{getFieldError('user_type')}</p>
              )}
            </div>

            {/* School Information (only for school owners) */}
            {showSchoolFields && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">School Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    name="school_name"
                    type="text"
                    required
                    value={schoolData.school_name}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('school_name') && (
                    <p className="text-sm text-red-600">{getFieldError('school_name')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_address">School Address</Label>
                  <Input
                    name="school_address"
                    type="text"
                    value={schoolData.school_address}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('school_address') && (
                    <p className="text-sm text-red-600">{getFieldError('school_address')}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_phone">School Phone</Label>
                    <Input
                      name="school_phone"
                      type="tel"
                      value={schoolData.school_phone}
                      onChange={handleSchoolDataChange}
                    />
                    {getFieldError('school_phone') && (
                      <p className="text-sm text-red-600">{getFieldError('school_phone')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_email">School Email</Label>
                    <Input
                      name="school_email"
                      type="email"
                      value={schoolData.school_email}
                      onChange={handleSchoolDataChange}
                    />
                    {getFieldError('school_email') && (
                      <p className="text-sm text-red-600">{getFieldError('school_email')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_website">School Website</Label>
                  <Input
                    name="school_website"
                    type="url"
                    value={schoolData.school_website}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('school_website') && (
                    <p className="text-sm text-red-600">{getFieldError('school_website')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus_name">Campus Name</Label>
                  <Input
                    name="campus_name"
                    type="text"
                    required
                    value={schoolData.campus_name}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('campus_name') && (
                    <p className="text-sm text-red-600">{getFieldError('campus_name')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus_address">Campus Address</Label>
                  <Input
                    name="campus_address"
                    type="text"
                    value={schoolData.campus_address}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('campus_address') && (
                    <p className="text-sm text-red-600">{getFieldError('campus_address')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus_phone">Campus Phone</Label>
                  <Input
                    name="campus_phone"
                    type="tel"
                    value={schoolData.campus_phone}
                    onChange={handleSchoolDataChange}
                  />
                  {getFieldError('campus_phone') && (
                    <p className="text-sm text-red-600">{getFieldError('campus_phone')}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm; 