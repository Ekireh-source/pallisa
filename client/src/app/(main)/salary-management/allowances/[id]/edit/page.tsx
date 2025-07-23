'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/salary-management/allowances/${allowance.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Salary Allowance</h1>
            <p className="text-gray-600 mt-2">
              Update allowance details and settings
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Allowance Details</CardTitle>
          <CardDescription>
            Update the details for this salary allowance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Allowance Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Housing Allowance"
                  required
                />
              </div>

              {/* Allowance Type */}
              <div className="space-y-2">
                <Label htmlFor="allowance_type">Allowance Type *</Label>
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
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
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
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href={`/salary-management/allowances/${allowance.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
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