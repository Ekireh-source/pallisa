'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchDepartmentById, 
  updateDepartment, 
  clearError 
} from '@/store/slices/departmentSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  Info,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const id = parseInt(params.id as string);
  
  // Redux state
  const departmentState = useAppSelector(state => state.departments);
  const { departments = [], loading = false, error = null } = departmentState || {};
  
  // Find the current department
  const currentDepartment = departments.find(dept => dept.id === id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load department data
  useEffect(() => {
    if (id) {
      dispatch(fetchDepartmentById(id));
    }
  }, [dispatch, id]);

  // Initialize form data when department is loaded
  useEffect(() => {
    if (currentDepartment && !isInitialized) {
      setFormData({
        name: currentDepartment.name,
        description: currentDepartment.description || '',
        is_active: currentDepartment.is_active,
      });
      setIsInitialized(true);
    }
  }, [currentDepartment, isInitialized]);

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
      await dispatch(updateDepartment({ id, data: formData })).unwrap();
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

  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentDepartment && !loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Department Not Found</h1>
              <p className="text-red-100 text-lg">
                The department you&apos;re looking for doesn&apos;t exist.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-red-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Department may have been deleted</span>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Edit className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Department</h1>
            <p className="text-blue-100 text-lg">
              Update the department details and settings
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Editing: {currentDepartment?.name}</span>
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
              Error Updating Department
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

      {/* Department Stats */}
      {currentDepartment && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Department Statistics
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-blue-900">{currentDepartment.expense_count}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Created</p>
                    <p className="text-lg font-bold text-green-900">
                      {new Date(currentDepartment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    {currentDepartment.is_active ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Status</p>
                    <p className="text-lg font-bold text-purple-900">
                      {currentDepartment.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit className="w-5 h-5 mr-2 text-blue-600" />
            Edit Department Details
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
                placeholder="Enter department name (e.g., Marketing, IT, Finance, etc.)"
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
                  Active (department can be used for new expenses)
                </label>
              </div>
              {!formData.is_active && (
                <div className="mt-3 flex items-center space-x-2 px-4 py-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-700 font-medium">
                    Warning: Deactivating this department will prevent it from being used in new expenses.
                  </p>
                </div>
              )}
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
                    <span className="ml-2">Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Update Department
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 