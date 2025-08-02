"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  DollarSign, 
  Calendar, 
  Users, 
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { apiGet, apiPost, API_ENDPOINTS } from "@/lib/api";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';

interface Option { id: number; name: string; }

export default function CreateFeeStructurePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "",
    class_obj: "",
    academic_year: "",
    term: "",
    amount: "",
    is_active: true,
  });
  const [categories, setCategories] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [categoriesData, classesData, yearsData, termsData] = await Promise.all([
          apiGet<{ results: Option[] }>(API_ENDPOINTS.FEES + 'categories/'),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.MEMBERS_CLASSES),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.ACADEMIC_YEARS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.TERMS),
        ]);
        
        setCategories(categoriesData.results || categoriesData);
        setClasses(classesData.results || classesData);
        setYears(yearsData.results || yearsData);
        setTerms(termsData.results || termsData);
      } catch (error) {
        setError("Failed to load form options");
        console.error('Error loading options:', error);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    const errors: { [key: string]: string } = {};
    if (!formData.category) errors.category = "Category is required";
    if (!formData.class_obj) errors.class_obj = "Class is required";
    if (!formData.academic_year) errors.academic_year = "Academic year is required";
    if (!formData.term) errors.term = "Term is required";
    if (!formData.amount) errors.amount = "Amount is required";
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      await apiPost(API_ENDPOINTS.FEES + 'structures/', {
        category: parseInt(formData.category),
        class_obj: parseInt(formData.class_obj),
        academic_year: parseInt(formData.academic_year),
        term: parseInt(formData.term),
        amount: parseFloat(formData.amount),
        is_active: formData.is_active,
      });
      router.push("/fees/structures");
    } catch (err) {
      setError("Failed to create structure");
      console.error('Error creating structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (optionsLoading) {
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
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Create Fee Structure
                  </h1>
                  <p className="text-purple-100 text-sm sm:text-base mt-1">
                    Define a new fee structure for a class, year, and term
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3 text-sm text-purple-100">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{categories.length} Categories</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{classes.length} Classes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href="/fees/structures"
                  className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Structures
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

        {/* Main Form Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <span>Fee Structure Details</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Fee Category *
                  </Label>
                  <select
                    id="category"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="class_obj" className="text-sm font-medium text-gray-700">
                    Class *
                  </Label>
                  <select
                    id="class_obj"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.class_obj ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.class_obj}
                    onChange={(e) => handleInputChange('class_obj', e.target.value)}
                    required
                  >
                    <option value="">Select a class...</option>
                    {classes?.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.class_obj && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.class_obj}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">
                    Academic Year *
                  </Label>
                  <select
                    id="academic_year"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.academic_year}
                    onChange={(e) => handleInputChange('academic_year', e.target.value)}
                    required
                  >
                    <option value="">Select an academic year...</option>
                    {years?.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.academic_year && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.academic_year}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="term" className="text-sm font-medium text-gray-700">
                    Term *
                  </Label>
                  <select
                    id="term"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.term}
                    onChange={(e) => handleInputChange('term', e.target.value)}
                    required
                  >
                    <option value="">Select a term...</option>
                    {terms.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.term && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.term}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Amount *
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">UGX</span>
                  </div>
                  <Input
                    type="number"
                    id="amount"
                    className={`pl-12 h-11 ${fieldErrors.amount ? 'border-red-300 bg-red-50' : ''}`}
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                {fieldErrors.amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.amount}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (structure can be used for new fees)
                </Label>
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                  <Link
                    href="/fees/structures"
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    Cancel
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Structure
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>Tips for creating fee structures</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Specific assignment</h4>
                  <p className="text-sm text-gray-600">Assign each structure to a specific class, year, and term</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Clear naming</h4>
                  <p className="text-sm text-gray-600">Use descriptive names for categories and classes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Total amount</h4>
                  <p className="text-sm text-gray-600">Amount should reflect the total fee for the structure</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Active status</h4>
                  <p className="text-sm text-gray-600">Only active structures will be available for new fees</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 