'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Loader2, TrendingDown, Edit, Shield, Heart, Clock, AlertTriangle, Settings, Activity, FileText } from 'lucide-react';
import Link from 'next/link';
import { getSalaryDeduction, updateSalaryDeduction } from '@/lib/api';
import { SalaryDeduction, SalaryDeductionCreateUpdate } from '@/types';
import { toast } from 'sonner';

export default function EditSalaryDeductionPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deduction, setDeduction] = useState<SalaryDeduction | null>(null);
  const [formData, setFormData] = useState<SalaryDeductionCreateUpdate>({
    name: '',
    deduction_type: 'tax',
    description: '',
    amount: 0,
    is_percentage: false,
    is_active: true
  });

  const deductionId = params.id ? parseInt(params.id as string) : null;

  const fetchDeduction = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryDeduction(deductionId!);
      setDeduction(data);
      setFormData({
        name: data.name,
        deduction_type: data.deduction_type,
        description: data.description || '',
        amount: data.amount,
        is_percentage: data.is_percentage,
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error fetching deduction:', error);
      toast.error('Failed to fetch salary deduction');
      router.push('/salary-management/deductions');
    } finally {
      setLoading(false);
    }
  }, [deductionId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!deductionId) {
      toast.error('Invalid deduction ID');
      router.push('/salary-management/deductions');
      return;
    }

    fetchDeduction();
  }, [isAuthenticated, router, deductionId, fetchDeduction]);

  const handleInputChange = (field: keyof SalaryDeductionCreateUpdate, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Deduction name is required');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      await updateSalaryDeduction(deductionId!, formData);
      toast.success('Salary deduction updated successfully');
      router.push(`/salary-management/deductions/${deductionId}`);
    } catch (error) {
      console.error('Error updating deduction:', error);
      toast.error('Failed to update salary deduction');
    } finally {
      setSaving(false);
    }
  };

  const getDeductionIcon = (type: string) => {
    switch (type) {
      case 'tax':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'insurance':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'medical':
        return <Heart className="h-4 w-4 text-green-600" />;
      case 'loan':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'advance':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!deduction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary deduction not found</p>
          <Link href="/salary-management/deductions">
            <Button className="mt-4">Back to Deductions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Edit className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Salary Deduction</h1>
            <p className="text-red-100 text-base sm:text-lg">
              Update deduction details and settings for {deduction.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-red-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Current Type: {deduction.deduction_type.replace('_', ' ')}</span>
            </div>
            <div className="w-1 h-1 bg-red-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Status: {deduction.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="w-1 h-1 bg-red-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Deduction Management</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href={`/salary-management/deductions/${deduction.id}`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Details
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            {getDeductionIcon(formData.deduction_type)}
            <span>Deduction Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update the details for this salary deduction
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Deduction Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., PAYE Tax"
                  required
                  className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500">Name of the deduction for identification</p>
              </div>

              {/* Deduction Type */}
              <div className="space-y-2">
                <Label htmlFor="deduction_type">Deduction Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.deduction_type}
                  onValueChange={(value) => handleInputChange('deduction_type', value)}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-red-500 focus:border-red-500">
                    <SelectValue placeholder="Select deduction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Category of the deduction</p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500">
                  {formData.is_percentage ? 'Percentage of base salary' : 'Fixed amount in UGX'}
                </p>
              </div>

              {/* Is Percentage */}
              <div className="space-y-2">
                <Label htmlFor="is_percentage">Amount Type</Label>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <Checkbox
                    id="is_percentage"
                    checked={formData.is_percentage}
                    onChange={(e) => handleInputChange('is_percentage', e.target.checked)}
                    className="focus:ring-2 focus:ring-red-500"
                  />
                  <Label htmlFor="is_percentage" className="text-sm font-medium">
                    {formData.is_percentage ? 'Percentage of base salary' : 'Fixed amount'}
                  </Label>
                </div>
                <p className="text-xs text-gray-500">Choose between fixed amount or percentage</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the deduction and its purpose..."
                rows={3}
                className="focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500">Optional description of the deduction</p>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="focus:ring-2 focus:ring-red-500"
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <p className="text-xs text-gray-500">Whether this deduction is currently active</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href={`/salary-management/deductions/${deduction.id}`}>
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving || !formData.name || formData.amount <= 0}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
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