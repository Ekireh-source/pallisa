'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Edit, Home, Car, Heart, Award, Clock, Gift, Settings, Activity, FileText } from 'lucide-react';
import Link from 'next/link';
import { getSalaryAllowance, updateSalaryAllowance } from '@/lib/api';
import { SalaryAllowance, SalaryAllowanceCreateUpdate } from '@/types';
import { toast } from 'sonner';

export default function EditSalaryAllowancePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allowance, setAllowance] = useState<SalaryAllowance | null>(null);
  const [formData, setFormData] = useState<SalaryAllowanceCreateUpdate>({
    name: '',
    allowance_type: 'housing',
    description: '',
    amount: 0,
    is_percentage: false,
    is_active: true
  });

  const allowanceId = params.id ? parseInt(params.id as string) : null;

  const fetchAllowance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryAllowance(allowanceId!);
      setAllowance(data);
      setFormData({
        name: data.name,
        allowance_type: data.allowance_type,
        description: data.description || '',
        amount: data.amount,
        is_percentage: data.is_percentage,
        is_active: data.is_active
      });
    } catch (error) {
      console.error('Error fetching allowance:', error);
      toast.error('Failed to fetch salary allowance');
      router.push('/salary-management/allowances');
    } finally {
      setLoading(false);
    }
  }, [allowanceId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!allowanceId) {
      toast.error('Invalid allowance ID');
      router.push('/salary-management/allowances');
      return;
    }

    fetchAllowance();
  }, [isAuthenticated, router, allowanceId, fetchAllowance]);

  const handleInputChange = (field: keyof SalaryAllowanceCreateUpdate, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Allowance name is required');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      await updateSalaryAllowance(allowanceId!, formData);
      toast.success('Salary allowance updated successfully');
      router.push(`/salary-management/allowances/${allowanceId}`);
    } catch (error) {
      console.error('Error updating allowance:', error);
      toast.error('Failed to update salary allowance');
    } finally {
      setSaving(false);
    }
  };

  const getAllowanceIcon = (type: string) => {
    switch (type) {
      case 'housing':
        return <Home className="h-4 w-4 text-blue-600" />;
      case 'transport':
        return <Car className="h-4 w-4 text-green-600" />;
      case 'medical':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'responsibility':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'overtime':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-pink-600" />;
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

  if (!allowance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary allowance not found</p>
          <Link href="/salary-management/allowances">
            <Button className="mt-4">Back to Allowances</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Edit className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Salary Allowance</h1>
            <p className="text-green-100 text-base sm:text-lg">
              Update allowance details and settings for {allowance.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-green-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Current Type: {allowance.allowance_type.replace('_', ' ')}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Status: {allowance.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Allowance Management</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href={`/salary-management/allowances/${allowance.id}`}
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
            {getAllowanceIcon(formData.allowance_type)}
            <span>Allowance Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update the details for this salary allowance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Allowance Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Housing Allowance"
                  required
                  className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500">Name of the allowance for identification</p>
              </div>

              {/* Allowance Type */}
              <div className="space-y-2">
                <Label htmlFor="allowance_type">Allowance Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.allowance_type}
                  onValueChange={(value) => handleInputChange('allowance_type', value)}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <SelectValue placeholder="Select allowance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="housing">Housing Allowance</SelectItem>
                    <SelectItem value="transport">Transport Allowance</SelectItem>
                    <SelectItem value="medical">Medical Allowance</SelectItem>
                    <SelectItem value="responsibility">Responsibility Allowance</SelectItem>
                    <SelectItem value="overtime">Overtime Allowance</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Category of the allowance</p>
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
                  className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="focus:ring-2 focus:ring-green-500"
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
                placeholder="Describe the allowance and its purpose..."
                rows={3}
                className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500">Optional description of the allowance</p>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="focus:ring-2 focus:ring-green-500"
                />
                <Label htmlFor="is_active" className="text-sm font-medium">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <p className="text-xs text-gray-500">Whether this allowance is currently active</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href={`/salary-management/allowances/${allowance.id}`}>
                <Button variant="outline" type="button" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving || !formData.name || formData.amount <= 0}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
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