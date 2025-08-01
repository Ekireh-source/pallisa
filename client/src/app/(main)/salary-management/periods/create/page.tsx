'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Loader2, Plus, Calendar, Clock, User, Activity } from 'lucide-react';
import Link from 'next/link';
import { createSalaryPeriod, academicYearApi, termApi } from '@/lib/api';
import { SalaryPeriodCreateUpdate, AcademicYear, Term } from '@/types';
import { toast } from 'sonner';

export default function CreateSalaryPeriodPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [formData, setFormData] = useState<SalaryPeriodCreateUpdate>({
    name: '',
    academic_year: 0, // Will be set after fetching data
    term: 0,
    start_date: '',
    end_date: '',
    is_active: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchAcademicYearsAndTerms();
  }, [isAuthenticated, router]);

  const fetchAcademicYearsAndTerms = async () => {
    try {
      setFetchingData(true);
      const [yearsData, termsData] = await Promise.all([
        academicYearApi.getAll(),
        termApi.getAll(),
      ]);
      setAcademicYears(yearsData);
      setTerms(termsData);
      
      // Set the first academic year as default if available
      if (yearsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          academic_year: yearsData[0].id
        }));
      }
      
    } catch (error) {
      console.error('Error fetching academic years and terms:', error);
      toast.error('Failed to fetch academic years and terms');
    } finally {
      setFetchingData(false);
    }
  };

  const handleInputChange = (field: keyof SalaryPeriodCreateUpdate, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.term || formData.term === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      await createSalaryPeriod(formData);
      toast.success('Salary period created successfully');
      router.push('/salary-management/periods');
    } catch (error: unknown) {
      console.error('Error creating salary period:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create salary period';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter terms by selected academic year
  const filteredTerms = terms.filter(term => term.academic_year === formData.academic_year);
  
  if (!isAuthenticated || fetchingData || academicYears.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Salary Period</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Add a new salary period for managing payments
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Academic Years: {academicYears.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Terms: {terms.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/salary-management/periods"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Periods
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Salary Period Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Fill in the details below to create a new salary period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Period Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., January 2024, Term 1 2024"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">Academic Year *</Label>
                <Select
                  value={formData.academic_year.toString()}
                  onValueChange={(value) => {
                    const yearId = parseInt(value);
                    handleInputChange('academic_year', yearId);
                    // Clear term when academic year changes
                    handleInputChange('term', 0);
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Term - Required for all periods */}
              <div className="space-y-2">
                <Label htmlFor="term" className="text-sm font-medium text-gray-700">Term *</Label>
                <Select
                  value={formData.term?.toString() || ''}
                  onValueChange={(value) => handleInputChange('term', parseInt(value))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTerms.length > 0 ? (
                      filteredTerms.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          {term.name}
                        </SelectItem>
                      ))
                    ) : terms.length > 0 ? (
                      // Fallback: show all terms if filtering doesn't work
                      terms.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          {term.name} ({term.academic_year})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No terms available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {filteredTerms.length === 0 && terms.length > 0 && (
                  <p className="text-sm text-orange-600">
                    No terms found for selected academic year. Showing all terms.
                  </p>
                )}
                {terms.length === 0 && (
                  <p className="text-sm text-red-600">
                    No terms available. Please create terms first.
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium text-gray-700">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">Set as active period</Label>
              </div>
              <p className="text-sm text-gray-500">
                Only one salary period can be active at a time. Setting this period as active will automatically deactivate any other active periods.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href="/salary-management/periods">
                <Button variant="outline" type="button" className="px-6 py-2">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="px-6 py-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Period
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 