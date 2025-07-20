"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiGet, apiPut, API_ENDPOINTS } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Option { 
  id: number; 
  name: string; 
}

interface FeeOverride {
  id: number;
  student: number;
  category: number;
  academic_year: number;
  term: number;
  custom_amount: string;
  reason: string;
  is_active: boolean;
}

export default function EditFeeOverridePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [formData, setFormData] = useState({
    student: "",
    category: "",
    academic_year: "",
    term: "",
    custom_amount: "",
    reason: "",
    is_active: true,
  });
  
  const [students, setStudents] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [studentsData, categoriesData, yearsData, termsData] = await Promise.all([
          apiGet<{ results: Option[] }>(API_ENDPOINTS.MEMBERS_STUDENTS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.FEES + 'categories/'),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.ACADEMIC_YEARS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.TERMS),
        ]);
        
        setStudents(studentsData.results || studentsData);
        setCategories(categoriesData.results || categoriesData);
        setYears(yearsData.results || yearsData);
        setTerms(termsData.results || termsData);
      } catch (error) {
        setError("Failed to load form options");
        console.error('Error loading options:', error);
      }
    };
    
    loadOptions();
  }, []);

  // Load existing data
  useEffect(() => {
    if (!id) return;
    
    const loadOverride = async () => {
      try {
        const data = await apiGet<FeeOverride>(API_ENDPOINTS.FEES + `overrides/${id}/`);
        setFormData({
          student: data.student.toString(),
          category: data.category.toString(),
          academic_year: data.academic_year.toString(),
          term: data.term.toString(),
          custom_amount: data.custom_amount,
          reason: data.reason,
          is_active: data.is_active,
        });
      } catch (error) {
        setError("Failed to load fee override");
        console.error('Error loading override:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOverride();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    try {
      await apiPut(API_ENDPOINTS.FEES + `overrides/${id}/`, {
        student: parseInt(formData.student),
        category: parseInt(formData.category),
        academic_year: parseInt(formData.academic_year),
        term: parseInt(formData.term),
        custom_amount: parseFloat(formData.custom_amount),
        reason: formData.reason,
        is_active: formData.is_active,
      });
      
      router.push("/fees/overrides");
    } catch (error) {
      setError("Failed to update fee override");
      console.error('Error updating override:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Student Fee Override</h1>
              <p className="mt-2 text-gray-600">
                Update the fee override details for this student
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  id="student"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.student}
                  onChange={(e) => handleInputChange('student', e.target.value)}
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Category *
                </label>
                <select
                  id="category"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <select
                  id="academic_year"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.academic_year}
                  onChange={(e) => handleInputChange('academic_year', e.target.value)}
                  required
                >
                  <option value="">Select an academic year...</option>
                  {years.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                  Term *
                </label>
                <select
                  id="term"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                  required
                >
                  <option value="">Select a term...</option>
                  {terms.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="custom_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Override Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">UGX</span>
                </div>
                <input
                  type="number"
                  id="custom_amount"
                  className="block w-full pl-7 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.custom_amount}
                  onChange={(e) => handleInputChange('custom_amount', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This amount will override the standard fee for this student
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Override
              </label>
              <textarea
                id="reason"
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Explain the reason for this fee override..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Provide a reason for this fee override
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Override
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 