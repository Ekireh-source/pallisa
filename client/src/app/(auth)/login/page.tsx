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

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@pallisa.com',
      student_id: '',
      password: 'demo123'
    });
    setLoginMethod('email');
    dispatch(clearError());
    setLocalErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PALLISA
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                Sign Up
              </Link>
            </div>

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 space-y-4">
              <Link href="/" className="block text-slate-300 hover:text-white transition-colors">Home</Link>
              <Link href="/register" className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-center">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl">
            
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-slate-300">Access your school dashboard</p>
            </div>

            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error || 'Please fix the errors below'}</p>
                </div>
              </div>
            )}

            {/* Login Method Toggle */}
            <div className="flex bg-slate-700/50 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => handleMethodToggle('email')}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === 'email'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
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
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError('email') ? 'border-red-400' : 'border-slate-600 hover:border-slate-500'
                      }`}
                    />
                  </div>
                  {getFieldError('email') && (
                    <p className="text-red-400 text-sm mt-1">{getFieldError('email')}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      placeholder="Enter your student ID"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError('student_id') ? 'border-red-400' : 'border-slate-600 hover:border-slate-500'
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-4 pr-12 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      getFieldError('password') ? 'border-red-400' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
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
                    className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-slate-300">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
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
              <p className="text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Create one now
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Demo Account</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p><strong className="text-blue-300">Email:</strong> demo@pallisa.com</p>
                <p><strong className="text-blue-300">Password:</strong> demo123</p>
              </div>
              <button
                onClick={handleDemoLogin}
                className="mt-3 w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-medium transition-all duration-200"
              >
                Use Demo Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
