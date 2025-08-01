'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Loader2, Edit, CreditCard, User, Calendar, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPayment, updateSalaryPayment, getSalaryPeriods, getTeachers, getNonStaffMembers } from '@/lib/api';
import { SalaryPayment, SalaryPaymentCreateUpdate, SalaryPeriod, StaffSalaryInfo } from '@/types';
import { toast } from 'sonner';

export default function EditSalaryPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [payment, setPayment] = useState<SalaryPayment | null>(null);
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

  const paymentId = params.id ? parseInt(params.id as string) : null;

  const fetchPayment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryPayment(paymentId!);
      setPayment(data);
      setFormData({
        teacher: data.teacher,
        non_staff_member: data.non_staff_member,
        salary_period: data.salary_period,
        base_salary: data.base_salary,
        payment_date: data.payment_date.split('T')[0],
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        transaction_reference: data.transaction_reference || '',
        notes: data.notes || '',
        allowance_details: data.details?.filter(d => d.allowance)?.map(d => ({
          allowance_id: d.allowance!,
          amount: d.amount,
          notes: d.notes
        })) || [],
        deduction_details: data.details?.filter(d => d.deduction)?.map(d => ({
          deduction_id: d.deduction!,
          amount: d.amount,
          notes: d.notes
        })) || []
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      toast.error('Failed to fetch salary payment');
      router.push('/salary-management/payments');
    } finally {
      setLoading(false);
    }
  }, [paymentId, router]);

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!paymentId) {
      toast.error('Invalid payment ID');
      router.push('/salary-management/payments');
      return;
    }

    fetchPayment();
    loadFormData();
  }, [isAuthenticated, router, paymentId, fetchPayment]);

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
      setSaving(true);
      await updateSalaryPayment(paymentId!, formData);
      toast.success('Salary payment updated successfully');
      router.push(`/salary-management/payments/${paymentId}`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update salary payment');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || loading || loadingFormData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary payment not found</p>
          <Link href="/salary-management/payments">
            <Button className="mt-4">Back to Payments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Edit className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Salary Payment</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Update payment details for {payment.staff_name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-purple-100 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Staff: {payment.staff_name}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'UGX' }).format(payment.net_salary)}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Status: {payment.payment_status}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href={`/salary-management/payments/${payment.id}`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>Payment Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update the details for this salary payment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
                    {teachers.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Teachers</div>
                        {teachers.map((teacher) => (
                          <SelectItem key={`teacher-${teacher.id}`} value={teacher.id.toString()}>
                            {teacher.name} (Teacher)
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {nonStaffMembers.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Non-Staff Members</div>
                        {nonStaffMembers.map((member) => (
                          <SelectItem key={`nonstaff-${member.id}`} value={member.id.toString()}>
                            {member.name} (Non-Staff)
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {teachers.length === 0 && nonStaffMembers.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No staff members available</div>
                    )}
                  </SelectContent>
                </Select>
                {loadingFormData && (
                  <p className="text-sm text-gray-500">Loading staff members...</p>
                )}
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
              <Link href={`/salary-management/payments/${payment.id}`}>
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