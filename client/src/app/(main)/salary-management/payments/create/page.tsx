'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createSalaryPayment, getSalaryPeriods, getTeachers, getNonStaffMembers } from '@/lib/api';
import { SalaryPaymentCreateUpdate, SalaryPeriod, StaffSalaryInfo } from '@/types';
import { toast } from 'sonner';

export default function CreateSalaryPaymentPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [periods, setPeriods] = useState<SalaryPeriod[]>([]);
  const [teachers, setTeachers] = useState<StaffSalaryInfo[]>([]);
  const [nonStaffMembers, setNonStaffMembers] = useState<StaffSalaryInfo[]>([]);
  const [formData, setFormData] = useState<SalaryPaymentCreateUpdate>({
    teacher: undefined,
    non_staff_member: undefined,
    salary_period: 0,
    base_salary: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    payment_status: 'pending',
    transaction_reference: '',
    notes: '',
    allowance_details: [],
    deduction_details: []
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadFormData();
  }, [isAuthenticated, router]);

  const loadFormData = async () => {
    try {
      setLoadingFormData(true);
      const [periodsData, teachersData, nonStaffData] = await Promise.all([
        getSalaryPeriods(),
        getTeachers(),
        getNonStaffMembers()
      ]);
      setPeriods(periodsData || []);
      
      // Transform teachers data to match StaffSalaryInfo type
      const transformedTeachers = Array.isArray(teachersData) ? teachersData.map(teacher => ({
        id: teacher.id,
        employee_id: teacher.employee_id,
        name: teacher.teacher_name || 'Unknown Teacher',
        email: teacher.user_email,
        employment_type: teacher.employment_type,
        base_salary: undefined,
        is_active: true,
        hire_date: teacher.hire_date || new Date().toISOString().split('T')[0]
      })) : [];
      
      // Transform non-staff data to match StaffSalaryInfo type
      const transformedNonStaff = Array.isArray(nonStaffData) ? nonStaffData.map(member => ({
        id: member.id,
        employee_id: member.employee_id,
        name: member.full_name || 'Unknown Member',
        email: undefined,
        employment_type: member.employment_type,
        base_salary: undefined,
        is_active: member.is_active,
        hire_date: member.hire_date
      })) : [];
      
      setTeachers(transformedTeachers);
      setNonStaffMembers(transformedNonStaff);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form data');
      // Set empty arrays as fallback
      setPeriods([]);
      setTeachers([]);
      setNonStaffMembers([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleInputChange = (field: keyof SalaryPaymentCreateUpdate, value: string | number | File | Array<{ allowance_id: number; amount: number; notes?: string }> | Array<{ deduction_id: number; amount: number; notes?: string }> | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacher && !formData.non_staff_member) {
      toast.error('Please select a staff member');
      return;
    }

    if (!formData.salary_period) {
      toast.error('Please select a salary period');
      return;
    }

    if (formData.base_salary <= 0) {
      toast.error('Base salary must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting form data:', formData);
      await createSalaryPayment(formData);
      toast.success('Salary payment created successfully');
      router.push('/salary-management/payments');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create salary payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loadingFormData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/salary-management/payments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Salary Payment</h1>
            <p className="text-gray-600 mt-2">
              Add a new salary payment for staff
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Fill in the details for the new salary payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Staff Member */}
              <div className="space-y-2">
                <Label htmlFor="staff_member">Staff Member *</Label>
                <Select
                  value={formData.teacher?.toString() || formData.non_staff_member?.toString() || ''}
                  onValueChange={(value) => {
                    const numValue = parseInt(value);
                    if (numValue) {
                      // Check if it's a teacher or non-staff member
                      const teacher = teachers.find(t => t.id === numValue);
                      if (teacher) {
                        handleInputChange('teacher', numValue);
                        handleInputChange('non_staff_member', undefined);
                      } else {
                        handleInputChange('teacher', undefined);
                        handleInputChange('non_staff_member', numValue);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={`teacher-${teacher.id}`} value={teacher.id.toString()}>
                        {teacher.name} (Teacher)
                      </SelectItem>
                    ))}
                    {nonStaffMembers.map((member) => (
                      <SelectItem key={`nonstaff-${member.id}`} value={member.id.toString()}>
                        {member.name} (Non-Staff)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Period */}
              <div className="space-y-2">
                <Label htmlFor="salary_period">Salary Period *</Label>
                <Select
                  value={formData.salary_period.toString()}
                  onValueChange={(value) => handleInputChange('salary_period', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id.toString()}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Base Salary */}
              <div className="space-y-2">
                <Label htmlFor="base_salary">Base Salary *</Label>
                <Input
                  id="base_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_salary}
                  onChange={(e) => handleInputChange('base_salary', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => handleInputChange('payment_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transaction Reference */}
            <div className="space-y-2">
              <Label htmlFor="transaction_reference">Transaction Reference</Label>
              <Input
                id="transaction_reference"
                value={formData.transaction_reference || ''}
                onChange={(e) => handleInputChange('transaction_reference', e.target.value)}
                placeholder="e.g., TXN123456789"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this payment..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/salary-management/payments">
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
                    Create Payment
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