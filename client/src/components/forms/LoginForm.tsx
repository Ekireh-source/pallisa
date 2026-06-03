'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError, clearFieldError } from '@/store/slices/authSlice';
import { LoginCredentials } from '@/types';
import { Input, Button, ErrorMessage, Card, Label } from '@/components/ui';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors, isAuthenticated } = useAppSelector((state) => state.auth);

  const [loginMethod, setLoginMethod] = useState<'email' | 'student_id'>('email');
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    student_id: '',
    password: '',
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (loginMethod === 'email') {
      if (!formData.email) errors.email = 'Email is required';
      else if (!formData.email.includes('@')) errors.email = 'Please enter a valid email';
    } else {
      if (!formData.student_id) errors.student_id = 'Student ID is required';
    }

    if (!formData.password) errors.password = 'Password is required';

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

    const credentials: LoginCredentials = {
      password: formData.password,
      ...(loginMethod === 'email' ? { email: formData.email } : { student_id: formData.student_id })
    };

    try {
      const result = await dispatch(loginUser(credentials));

      if (loginUser.fulfilled.match(result)) {
        // Check if email verification is required
        const user = result.payload.user_profile;
        if (user && !user.email_verified) {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email || '')}`);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleMethodToggle = () => {
    setLoginMethod(prev => prev === 'email' ? 'student_id' : 'email');
    setFormData({ email: '', student_id: '', password: formData.password });
    dispatch(clearError());
    setLocalErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-My-Black">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-My-Black">
          Or{' '}
          <button
            onClick={() => router.push('/register')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
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

            {/* Login method toggle */}
            <div className="flex items-center justify-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={handleMethodToggle}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'email'
                    ? 'bg-white text-My-Black '
                    : 'text-gray-500 hover:text-My-Black'
                    }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={handleMethodToggle}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'student_id'
                    ? 'bg-white text-My-Black '
                    : 'text-gray-500 hover:text-My-Black'
                    }`}
                >
                  Student ID
                </button>
              </div>
            </div>

            {/* Dynamic input based on login method */}
            {loginMethod === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
                {getFieldError('email') && (
                  <p className="text-sm text-red-600">{getFieldError('email')}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  name="student_id"
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={handleInputChange}
                  placeholder="Enter your student ID"
                />
                {getFieldError('student_id') && (
                  <p className="text-sm text-red-600">{getFieldError('student_id')}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
              />
              {getFieldError('password') && (
                <p className="text-sm text-red-600">{getFieldError('password')}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-My-Black">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm; 