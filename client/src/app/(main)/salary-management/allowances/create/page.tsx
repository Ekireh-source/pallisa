'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Plus, Home, Car, Heart, Award, Clock, Gift, Settings } from 'lucide-react';
import Link from 'next/link';
import { createSalaryAllowance } from '@/lib/api';
import { SalaryAllowanceCreateUpdate } from '@/types';
import { toast } from 'sonner';

export default function CreateSalaryAllowancePage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SalaryAllowanceCreateUpdate>({
    name: '',
    allowance_type: 'housing',
    description: '',
    amount: 0,
    is_percentage: false,
    is_active: true
  });

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
      setLoading(true);
      await createSalaryAllowance(formData);
      toast.success('Salary allowance created successfully');
      router.push('/salary-management/allowances');
    } catch (error) {
      console.error('Error creating allowance:', error);
      toast.error('Failed to create salary allowance');
    } finally {
      setLoading(false);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create Salary Allowance</h1>
            <p className="text-green-100 text-lg">
              Add a new salary allowance for staff members
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-green-100">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Allowance Management</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span className="text-sm">Staff Benefits</span>
            </div>
          </div>
          <Link
            href="/salary-management/allowances"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Allowances
          </Link>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {getAllowanceIcon(formData.allowance_type)}
            <span>Allowance Details</span>
          </CardTitle>
          <CardDescription>
            Fill in the details for the new salary allowance
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <SelectTrigger>
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
                />
                <p className="text-xs text-gray-500">
                  {formData.is_percentage ? 'Percentage of base salary' : 'Fixed amount in UGX'}
                </p>
              </div>

              {/* Is Percentage */}
              <div className="space-y-2">
                <Label htmlFor="is_percentage">Amount Type</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_percentage"
                    checked={formData.is_percentage}
                    onChange={(e) => handleInputChange('is_percentage', e.target.checked)}
                  />
                  <Label htmlFor="is_percentage">
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
              />
              <p className="text-xs text-gray-500">Optional description of the allowance</p>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <p className="text-xs text-gray-500">Whether this allowance is currently active</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href="/salary-management/allowances">
                <Button variant="outline" type="button" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !formData.name || formData.amount <= 0} className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating Allowance...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Allowance</span>
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