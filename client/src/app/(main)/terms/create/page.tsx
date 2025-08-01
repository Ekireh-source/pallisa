'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { createTerm, clearError } from '@/store/slices/termSlice';
import { fetchAcademicYears } from '@/store/slices/academicYearSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Activity,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

export default function CreateTermPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state
  const termState = useAppSelector(state => state.terms);
  const academicYearState = useAppSelector(state => state.academicYears);
  const { loading = false, error = null } = termState || {};
  const { academic_years = [], loading: academicYearsLoading = false } = academicYearState || {};
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    academic_year: '',
    start_date: '',
    end_date: '',
    is_current: false,
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load academic years on component mount
  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      errors.name = 'Term name is required';
    }
    if (!formData.academic_year) {
      errors.academic_year = 'Academic year is required';
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
      const submitData = {
        ...formData,
        academic_year: parseInt(formData.academic_year)
      };
      await dispatch(createTerm(submitData)).unwrap();
      router.push('/terms');
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

  // Show loading spinner while academic years are loading
  if (academicYearsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Create Academic Term
                  </h1>
                  <p className="text-green-100 text-sm sm:text-base mt-1">
                    Add a new term to organize your school calendar
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3 text-sm text-green-100">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{academic_years.length} Academic Years</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href="/terms"
                  className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Terms
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check if academic years are available */}
        {academic_years.length === 0 ? (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    No academic years found
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to create at least one academic year before you can add terms.{' '}
                    <Link 
                      href="/academic-years" 
                      className="font-medium underline text-yellow-700 hover:text-yellow-600"
                    >
                      Create academic years here
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Form Card */
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span>Term Details</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Term Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Term Name *
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-2 h-11 ${fieldErrors.name ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Enter term name (e.g., First Term, Second Term, etc.)"
                    maxLength={100}
                  />
                  {fieldErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Academic Year */}
                <div>
                  <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">
                    Academic Year *
                  </Label>
                  <select
                    id="academic_year"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an academic year</option>
                    {academic_years.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.academic_year && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.academic_year}
                    </p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                      Start Date *
                    </Label>
                    <Input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className={`mt-2 h-11 ${fieldErrors.start_date ? 'border-red-300 bg-red-50' : ''}`}
                    />
                    {fieldErrors.start_date && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {fieldErrors.start_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="end_date" className="text-sm font-medium text-gray-700">
                      End Date *
                    </Label>
                    <Input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className={`mt-2 h-11 ${fieldErrors.end_date ? 'border-red-300 bg-red-50' : ''}`}
                    />
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
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="is_current"
                      name="is_current"
                      checked={formData.is_current}
                      onChange={handleInputChange}
                    />
                    <Label htmlFor="is_current" className="text-sm text-gray-700">
                      Set as current term (only one term can be current)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <Label htmlFor="is_active" className="text-sm text-gray-700">
                      Active (term can be used for new expenses and activities)
                    </Label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                    <Link
                      href="/terms"
                      className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </Link>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Term
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help Text Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>Tips for creating terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Clear naming</h4>
                  <p className="text-sm text-gray-600">Use descriptive names that reflect the term's position</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Date management</h4>
                  <p className="text-sm text-gray-600">Ensure dates don't overlap with other terms</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Current term</h4>
                  <p className="text-sm text-gray-600">Only one term should be marked as current</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Organization</h4>
                  <p className="text-sm text-gray-600">Terms help organize expenses and activities</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 