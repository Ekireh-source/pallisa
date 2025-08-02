'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { createAcademicYear, clearError } from '@/store/slices/academicYearSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Info,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function CreateAcademicYearPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state
  const academicYearState = useAppSelector(state => state.academicYears);
  const { loading = false, error = null } = academicYearState || {};
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Academic year name is required';
    }
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      errors.end_date = 'End date must be after start date';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(createAcademicYear(formData)).unwrap();
      router.push('/academic-years');
    } catch (error: unknown) {
      // Handle validation errors from API
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        setFieldErrors((error as { fieldErrors: Record<string, string> }).fieldErrors);
      }
    }
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create Academic Year</h1>
            <p className="text-blue-100 text-lg">
              Add a new academic year to organize your school&apos;s terms and expenses
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Organize school terms efficiently</span>
            </div>
          </div>
          <Link
            href="/academic-years"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Academic Years
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Creating Academic Year
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            Academic Year Details
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Academic Year Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                Academic Year Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                    fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter academic year name (e.g., 2023-2024, 2024-2025)"
                  maxLength={100}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-3">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      fieldErrors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {fieldErrors.start_date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-3">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      fieldErrors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {fieldErrors.end_date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.end_date}
                  </p>
                )}
              </div>
            </div>

            {/* Status Options */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="is_current"
                    name="is_current"
                    checked={formData.is_current}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="is_current" className="block text-sm font-medium text-gray-900">
                    Set as current academic year (only one can be current)
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="is_active" className="block text-sm font-medium text-gray-900">
                    Active (academic year can be used for new terms and expenses)
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
              <Link
                href="/academic-years"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Academic Year
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Tips for Creating Academic Years
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use clear naming conventions like &quot;2023-2024&quot; or &quot;Academic Year 2024&quot;</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Set appropriate start and end dates that cover the full academic period</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Only one academic year should be marked as &quot;current&quot; at a time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Academic years help organize terms and expenses for better reporting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 