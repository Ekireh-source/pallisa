'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/salary-management/deductions/${deduction.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Salary Deduction</h1>
            <p className="text-gray-600 mt-2">
              Update deduction details and settings
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Deduction Details</CardTitle>
          <CardDescription>
            Update the details for this salary deduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Deduction Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., PAYE Tax"
                  required
                />
              </div>

              {/* Deduction Type */}
              <div className="space-y-2">
                <Label htmlFor="deduction_type">Deduction Type *</Label>
                <Select
                  value={formData.deduction_type}
                  onValueChange={(value) => handleInputChange('deduction_type', value)}
                >
                  <SelectTrigger>
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
                placeholder="Describe the deduction and its purpose..."
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
              <Link href={`/salary-management/deductions/${deduction.id}`}>
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