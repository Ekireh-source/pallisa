'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {fetchingData ? 'Loading...' : 'No academic years available. Please create academic years first.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/salary-management/periods">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Salary Period</h1>
            <p className="text-gray-600 mt-2">
              Add a new salary period for managing payments
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Salary Period Details</CardTitle>
          <CardDescription>
            Fill in the details below to create a new salary period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Period Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., January 2024, Term 1 2024"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Select
                  value={formData.academic_year.toString()}
                  onValueChange={(value) => {
                    const yearId = parseInt(value);
                    handleInputChange('academic_year', yearId);
                    // Clear term when academic year changes
                    handleInputChange('term', 0);
                  }}
                >
                  <SelectTrigger>
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
                <Label htmlFor="term">Term *</Label>
                <Select
                  value={formData.term?.toString() || ''}
                  onValueChange={(value) => handleInputChange('term', parseInt(value))}
                >
                  <SelectTrigger>
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
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
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
                <Label htmlFor="is_active">Set as active period</Label>
              </div>
              <p className="text-sm text-gray-500">
                Only one salary period can be active at a time. Setting this period as active will automatically deactivate any other active periods.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link href="/salary-management/periods">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
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