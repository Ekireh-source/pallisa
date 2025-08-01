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
  AlertCircle,
  GraduationCap,
  Zap,
  Lock
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
    
    await dispatch(loginUser(credentials));
  };

  const handleMethodToggle = (method: 'email' | 'student_id') => {
    setLoginMethod(method);
    // Clear form data when switching methods
    setFormData(prev => ({
      ...prev,
      email: method === 'email' ? prev.email : '',
      student_id: method === 'student_id' ? prev.student_id : ''
    }));
    // Clear errors
    dispatch(clearError());
    setLocalErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PALLISA
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center group">
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Home
              </Link>
              <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
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
              <Link href="/register" className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-center">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-lg">Sign in to access your school dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 border-0 shadow-2xl backdrop-blur-sm">
            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-red-600 text-sm font-medium">{error || 'Please fix the errors below'}</p>
                </div>
              </div>
            )}

            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => handleMethodToggle('email')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                  loginMethod === 'email'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-400 hover:bg-gray-50'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => handleMethodToggle('student_id')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                  loginMethod === 'student_id'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-400 hover:bg-gray-50'
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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('email') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('email')}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Student ID
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      placeholder="Enter your student ID"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('student_id') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('student_id') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('student_id')}
                    </p>
                  )}
                </div>
              )}

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                      getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Fast & Secure</p>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">Protected</p>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Academic</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
