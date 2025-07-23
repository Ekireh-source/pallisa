'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError, clearFieldError } from '@/store/slices/authSlice';
import type { LoginCredentials } from '@/types';
import {
  Eye,
  EyeOff,
  Mail,
  User,
  ArrowRight,
  Shield,
  BookOpen,
  Menu,
  X,
  Home,
  AlertCircle
} from "lucide-react";

export default function PallisaLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors, isAuthenticated } = useAppSelector((state) => state.auth);

  const [loginMethod, setLoginMethod] = useState<'email' | 'student_id'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    student_id: '',
    password: ''
  });
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const credentials: LoginCredentials = {
      password: formData.password,
      ...(loginMethod === 'email' ? { email: formData.email } : { student_id: formData.student_id })
    };

    try {
      const result = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(result)) {
        // Check if email verification is required
        const userProfile = result.payload.user_profile;
        // The email_verified field is in the nested user object
        const isEmailVerified = userProfile?.user?.email_verified;
        
        if (userProfile && !isEmailVerified) {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email || '')}`);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleMethodToggle = (method: 'email' | 'student_id') => {
    setLoginMethod(method);
    setFormData(prev => ({ 
      ...prev, 
      email: '', 
      student_id: '',
      password: prev.password 
    }));
    dispatch(clearError());
    setLocalErrors({});
  };



  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'}`}> 
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-400">
                PALLISA
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link href="/register" className="px-6 py-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-all duration-300">
                Sign Up
              </Link>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 space-y-4">
              <Link href="/" className="block text-gray-600 hover:text-blue-400 transition-colors">Home</Link>
              <Link href="/register" className="w-full px-6 py-3 bg-blue-400 text-white rounded-full text-center">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Access your school dashboard</p>
            </div>
            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error || 'Please fix the errors below'}</p>
                </div>
              </div>
            )}
            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => handleMethodToggle('email')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-blue-400 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-400'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => handleMethodToggle('student_id')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === 'student_id'
                    ? 'bg-blue-400 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-400'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Student ID
              </button>
            </div>
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dynamic Input */}
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-100 border rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                        getFieldError('email') ? 'border-red-400' : 'border-gray-200 hover:border-blue-100'
                      }`}
                    />
                  </div>
                  {getFieldError('email') && (
                    <p className="text-red-400 text-sm mt-1">{getFieldError('email')}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      placeholder="Enter your student ID"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-100 border rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                        getFieldError('student_id') ? 'border-red-400' : 'border-gray-200 hover:border-blue-100'
                      }`}
                    />
                  </div>
                  {getFieldError('student_id') && (
                    <p className="text-red-400 text-sm mt-1">{getFieldError('student_id')}</p>
                  )}
                </div>
              )}
              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-4 pr-12 py-3 bg-gray-100 border rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                      getFieldError('password') ? 'border-red-400' : 'border-gray-200 hover:border-blue-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('password')}</p>
                )}
              </div>
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-400 bg-gray-100 border-gray-200 rounded focus:ring-blue-400 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-400 rounded-xl font-semibold text-white hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-500 transition-colors font-medium">
                  Create one now
                </Link>
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
