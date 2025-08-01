'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, Loader2, Plus, CreditCard, User, Calendar, DollarSign, Activity, FileText } from 'lucide-react';
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

  // Debug effect to log when data changes
  useEffect(() => {
    console.log("Teachers data changed:", teachers.length, teachers);
    console.log("Non-staff data changed:", nonStaffMembers.length, nonStaffMembers);
  }, [teachers, nonStaffMembers]);

  const loadFormData = async () => {
    try {
      setLoadingFormData(true);
      console.log("Starting to load form data...");
      
      const [periodsData, teachersData, nonStaffData] = await Promise.all([
        getSalaryPeriods(),
        getTeachers(),
        getNonStaffMembers()
      ]);
      
      console.log("API responses received:");
      console.log("Periods data:", periodsData);
      console.log("Teachers data:", teachersData);
      console.log("Non-staff data:", nonStaffData);
      
      setPeriods(periodsData || []);
      
      // Transform teachers data to match StaffSalaryInfo type
      const transformedTeachers = Array.isArray(teachersData) ? teachersData.map(teacher => ({
        id: teacher.id,
        employee_id: teacher.employee_id,
        name: teacher.teacher_name || 'Unknown Teacher',
        email: teacher.user_email,
        employment_type: teacher.employment_type,
        base_salary: undefined, // MemberTeacher doesn't have salary field
        is_active: true, // Default to true since MemberTeacher doesn't have is_active
        hire_date: teacher.hire_date || new Date().toISOString().split('T')[0]
      })) : [];
      
      // Transform non-staff data to match StaffSalaryInfo type
      const transformedNonStaff = Array.isArray(nonStaffData) ? nonStaffData.map(member => ({
        id: member.id,
        employee_id: member.employee_id,
        name: member.full_name || 'Unknown Member',
        email: undefined, // NonStaffMember doesn't have email field
        employment_type: member.employment_type,
        base_salary: member.salary ? parseFloat(member.salary.toString()) : undefined,
        is_active: member.is_active,
        hire_date: member.hire_date || new Date().toISOString().split('T')[0]
      })) : [];

      console.log("Transformed data:");
      console.log("Transformed teachers:", transformedTeachers);
      console.log("Transformed non-staff:", transformedNonStaff);
      console.log("Teachers count:", transformedTeachers.length);
      console.log("Non-staff count:", transformedNonStaff.length);
      
      setTeachers(transformedTeachers);
      setNonStaffMembers(transformedNonStaff);
      
      // Show a toast if no staff members are found
      if (transformedTeachers.length === 0 && transformedNonStaff.length === 0) {
        toast.warning('No staff members found. Please add teachers or non-staff members first.');
      }
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Salary Payment</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Add a new salary payment for staff members
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-purple-100 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Available Staff: {teachers.length + nonStaffMembers.length}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Periods: {periods.length}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Payment Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/salary-management/payments"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Payments
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
            Fill in the details for the new salary payment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Staff Member */}
              <div className="space-y-2">
                <Label htmlFor="staff_member" className="text-sm font-medium text-gray-700">Staff Member *</Label>
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
                  <SelectTrigger className="h-11">
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
                {!loadingFormData && teachers.length === 0 && nonStaffMembers.length === 0 && (
                  <p className="text-sm text-gray-500">No staff members found. Please add teachers or non-staff members first.</p>
                )}
              </div>

              {/* Salary Period */}
              <div className="space-y-2">
                <Label htmlFor="salary_period" className="text-sm font-medium text-gray-700">Salary Period *</Label>
                <Select
                  value={formData.salary_period.toString()}
                  onValueChange={(value) => handleInputChange('salary_period', parseInt(value))}
                >
                  <SelectTrigger className="h-11">
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
                <Label htmlFor="base_salary" className="text-sm font-medium text-gray-700">Base Salary *</Label>
                <Input
                  id="base_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_salary}
                  onChange={(e) => handleInputChange('base_salary', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="h-11"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment_date" className="text-sm font-medium text-gray-700">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700">Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleInputChange('payment_method', value)}
                >
                  <SelectTrigger className="h-11">
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
                <Label htmlFor="payment_status" className="text-sm font-medium text-gray-700">Payment Status *</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => handleInputChange('payment_status', value)}
                >
                  <SelectTrigger className="h-11">
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
              <Label htmlFor="transaction_reference" className="text-sm font-medium text-gray-700">Transaction Reference</Label>
              <Input
                id="transaction_reference"
                value={formData.transaction_reference || ''}
                onChange={(e) => handleInputChange('transaction_reference', e.target.value)}
                placeholder="e.g., TXN123456789"
                className="h-11"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this payment..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href="/salary-management/payments">
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