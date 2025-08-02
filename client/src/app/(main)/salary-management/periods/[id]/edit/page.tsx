'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Loader2, Calendar, Edit, User, Activity } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPeriod, updateSalaryPeriod, academicYearApi, termApi } from '@/lib/api';
import { SalaryPeriod, SalaryPeriodCreateUpdate, AcademicYear, Term } from '@/types';
import { toast } from 'sonner';

export default function EditSalaryPeriodPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [period, setPeriod] = useState<SalaryPeriod | null>(null);
  const [formData, setFormData] = useState<SalaryPeriodCreateUpdate>({
    name: '',
    academic_year: 0,
    term: 0,
    start_date: '',
    end_date: '',
    is_active: false
  });

  const periodId = params.id ? parseInt(params.id as string) : null;

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      const [periodData, yearsData, termsData] = await Promise.all([
        getSalaryPeriod(periodId!),
        academicYearApi.getAll(),
        termApi.getAll()
      ]);
      
      setPeriod(periodData);
      setAcademicYears(yearsData);
      setTerms(termsData);
      
      setFormData({
        name: periodData.name,
        academic_year: periodData.academic_year,
        term: periodData.term || 0,
        start_date: periodData.start_date,
        end_date: periodData.end_date,
        is_active: periodData.is_active
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      router.push('/salary-management/periods');
    } finally {
      setFetching(false);
    }
  }, [periodId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!periodId) {
      toast.error('Invalid period ID');
      router.push('/salary-management/periods');
      return;
    }

    fetchData();
  }, [isAuthenticated, router, periodId, fetchData]);

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
      await updateSalaryPeriod(periodId!, formData);
      toast.success('Salary period updated successfully');
      router.push(`/salary-management/periods/${periodId}`);
    } catch (error) {
      console.error('Error updating period:', error);
      toast.error('Failed to update salary period');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Period Not Found</h1>
          <p className="text-gray-600 mb-6">The period you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/salary-management/periods">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Back to Periods
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Edit className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Salary Period</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Update period details for {period.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Period: {period.name}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Academic Year: {period.academic_year_name}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Status: {period.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href={`/salary-management/periods/${period.id}`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Period
            </Link>
            </div>
          </div>
        </div>

        {/* Form */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Period Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update the details for this salary period
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
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter period name"
                  className="h-11"
                      required
                    />
                  </div>
                  
              {/* Academic Year */}
                    <div className="space-y-2">
                <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">Academic Year *</Label>
                      <Select value={formData.academic_year.toString()} onValueChange={(value) => handleInputChange('academic_year', parseInt(value))}>
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
                    
              {/* Term */}
                    <div className="space-y-2">
                <Label htmlFor="term" className="text-sm font-medium text-gray-700">Term *</Label>
                      <Select value={formData.term.toString()} onValueChange={(value) => handleInputChange('term', parseInt(value))}>
                  <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((term) => (
                            <SelectItem key={term.id} value={term.id.toString()}>
                              {term.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

              {/* Start Date */}
                    <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="h-11"
                        required
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
                  className="h-11"
                        required
                      />
                    </div>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">Set as active period</Label>
                  </div>
              <p className="text-sm text-gray-500">
                Only one salary period can be active at a time. Setting this period as active will automatically deactivate any other active periods.
                  </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href={`/salary-management/periods/${period.id}`}>
                <Button variant="outline" type="button" className="px-6 py-2">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="px-6 py-2">
                    {loading ? (
                      <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                    <Save className="h-4 w-4 mr-2" />
                        Save Changes
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