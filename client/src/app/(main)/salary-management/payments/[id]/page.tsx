'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ArrowLeft, Edit, DollarSign, CreditCard, Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPayment } from '@/lib/api';
import { SalaryPayment } from '@/types';
import { toast } from 'sonner';

export default function SalaryPaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<SalaryPayment | null>(null);

  const paymentId = params.id ? parseInt(params.id as string) : null;

  const fetchPayment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryPayment(paymentId!);
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment:', error);
      toast.error('Failed to fetch salary payment');
      router.push('/salary-management/payments');
    } finally {
      setLoading(false);
    }
  }, [paymentId, router]);

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
  }, [isAuthenticated, router, paymentId, fetchPayment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'cash':
        return <Wallet className="h-6 w-6 text-green-600" />;
      case 'mobile_money':
        return <DollarSign className="h-6 w-6 text-purple-600" />;
      case 'check':
        return <CreditCard className="h-6 w-6 text-orange-600" />;
      default:
        return <DollarSign className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-gray-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'bg-blue-100 text-blue-800';
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'mobile_money':
        return 'bg-purple-100 text-purple-800';
      case 'check':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const staffName = payment.staff_name;

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
            <h1 className="text-3xl font-bold text-gray-900">Salary Payment</h1>
            <p className="text-gray-600 mt-2">
              Payment details for {staffName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/salary-management/payments/${payment.id}/edit`}>
            <Button className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Payment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payment.net_salary)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {payment.payment_status}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                {getPaymentStatusIcon(payment.payment_status)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Method</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {payment.payment_method.replace('_', ' ')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                {getPaymentMethodIcon(payment.payment_method)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core details about this salary payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff Member</p>
                <p className="text-gray-900">{staffName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Salary Period</p>
                <p className="text-gray-900">{payment.salary_period_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Base Salary</p>
                <p className="text-gray-900">{formatCurrency(payment.base_salary)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Date</p>
                <p className="text-gray-900">{formatDateTime(payment.payment_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Status</p>
                <Badge className={getPaymentStatusColor(payment.payment_status)}>
                  {payment.payment_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Method</p>
                <Badge className={getPaymentMethodColor(payment.payment_method)}>
                  {payment.payment_method.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>
              Salary breakdown and calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Base Salary</p>
                <p className="text-gray-900">{formatCurrency(payment.base_salary)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Allowances</p>
                <p className="text-gray-900">{formatCurrency(payment.allowances)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="text-gray-900">{formatCurrency(payment.deductions)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Salary</p>
                <p className="text-gray-900 font-semibold">{formatCurrency(payment.net_salary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Information */}
      {payment.transaction_reference && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
            <CardDescription>
              Payment transaction details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaction Reference</p>
                <p className="text-gray-900">{payment.transaction_reference}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Date</p>
                <p className="text-gray-900">{formatDateTime(payment.payment_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {payment.notes && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Additional notes about this payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{payment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{formatDateTime(payment.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(payment.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for this salary payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href={`/salary-management/payments/${payment.id}/edit`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Payment</span>
              </Button>
            </Link>
            <Link href="/salary-management/payments">
              <Button variant="outline" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>View All Payments</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 