'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { createDepartment, clearError } from '@/store/slices/departmentSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  Plus, 
  Building2, 
  Info,
  AlertCircle
} from 'lucide-react';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state
  const departmentState = useAppSelector(state => state.departments);
  const { loading = false, error = null } = departmentState || {};
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
      errors.name = 'Department name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await dispatch(createDepartment(formData)).unwrap();
      router.push('/departments');
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
            <h1 className="text-3xl font-bold mb-2">Create Department</h1>
            <p className="text-blue-100 text-lg">
              Add a new department to organize your school structure
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Organize school structure efficiently</span>
            </div>
          </div>
          <Link
            href="/departments"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Departments
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Creating Department
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
            Department Details
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                  fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter department name (e.g., Mathematics, Science, Administration, etc.)"
                maxLength={100}
              />
              {fieldErrors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                  fieldErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Optional description of the department's role and responsibilities"
              />
              {fieldErrors.description && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {/* Active Status */}
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
                  Active (department can be used for new staff and expenses)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
              <Link
                href="/departments"
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
                    Create Department
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
            Tips for Creating Departments
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
                  <span>Use clear, descriptive names that reflect the department&apos;s function</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Consider creating departments for different subject areas and administrative functions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Examples: Mathematics, Science, English, Administration, IT Support, Maintenance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Departments help organize staff, expenses, and other school resources</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 