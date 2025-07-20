'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearError, clearFieldError } from '@/store/slices/authSlice';
import { RegisterData, SchoolRegistrationData } from '@/types';
import { Input, Button, Select, ErrorMessage, Card } from '@/components/ui';

const userTypeOptions = [
  { value: 'school_owner', label: 'School Owner' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
];

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'school_owner',
    phone: '',
  });

  // School data state (only for school owners)
  const [schoolData, setSchoolData] = useState<SchoolRegistrationData>({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_website: '',
    campus_name: '',
    campus_address: '',
    campus_phone: '',
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showSchoolFields, setShowSchoolFields] = useState(true);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Show/hide school fields based on user type
  useEffect(() => {
    setShowSchoolFields(formData.user_type === 'school_owner');
  }, [formData.user_type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name));
    }
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSchoolData(prev => ({ ...prev, [name]: value }));
    
    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name));
    }
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.email) errors.email = 'Email is required';
    else if (!formData.email.includes('@')) errors.email = 'Please enter a valid email';
    
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';

    // School owner specific validation
    if (formData.user_type === 'school_owner') {
      if (!schoolData.school_name) errors.school_name = 'School name is required';
      if (!schoolData.campus_name) errors.campus_name = 'Campus name is required';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName] || localErrors[fieldName];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const registrationData: RegisterData = {
      ...formData,
      school_data: showSchoolFields ? schoolData : undefined,
    };

    try {
      const result = await dispatch(registerUser(registrationData));
      
      if (registerUser.fulfilled.match(result)) {
        // Registration successful - redirect to verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to your existing account
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display general error and field errors */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <ErrorMessage 
                message={error || undefined} 
                errors={Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined}
              />
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleInputChange}
                error={getFieldError('first_name')}
              />
              <Input
                label="Last Name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleInputChange}
                error={getFieldError('last_name')}
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              error={getFieldError('email')}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              error={getFieldError('password')}
              helperText="Must be at least 8 characters"
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={getFieldError('phone')}
            />

            <Select
              label="User Type"
              name="user_type"
              required
              value={formData.user_type}
              onChange={handleInputChange}
              options={userTypeOptions}
              error={getFieldError('user_type')}
            />

            {/* School Information (only for school owners) */}
            {showSchoolFields && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">School Information</h3>
                
                <Input
                  label="School Name"
                  name="school_name"
                  type="text"
                  required
                  value={schoolData.school_name}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('school_name')}
                />

                <Input
                  label="School Address"
                  name="school_address"
                  type="text"
                  value={schoolData.school_address}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('school_address')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="School Phone"
                    name="school_phone"
                    type="tel"
                    value={schoolData.school_phone}
                    onChange={handleSchoolDataChange}
                    error={getFieldError('school_phone')}
                  />
                  <Input
                    label="School Email"
                    name="school_email"
                    type="email"
                    value={schoolData.school_email}
                    onChange={handleSchoolDataChange}
                    error={getFieldError('school_email')}
                  />
                </div>

                <Input
                  label="School Website"
                  name="school_website"
                  type="url"
                  value={schoolData.school_website}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('school_website')}
                  placeholder="https://example.com"
                />

                <h4 className="text-md font-medium text-gray-800 mt-6">Campus Information</h4>
                
                <Input
                  label="Campus Name"
                  name="campus_name"
                  type="text"
                  required
                  value={schoolData.campus_name}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('campus_name')}
                />

                <Input
                  label="Campus Address"
                  name="campus_address"
                  type="text"
                  value={schoolData.campus_address}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('campus_address')}
                />

                <Input
                  label="Campus Phone"
                  name="campus_phone"
                  type="tel"
                  value={schoolData.campus_phone}
                  onChange={handleSchoolDataChange}
                  error={getFieldError('campus_phone')}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm; 