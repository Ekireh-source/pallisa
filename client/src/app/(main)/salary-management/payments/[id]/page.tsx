'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit, DollarSign, CreditCard, Wallet, Activity, FileText, Calendar, User, TrendingUp, Settings, Plus, MinusIcon } from 'lucide-react';
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

 

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
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

  const staffName = payment.staff_name;

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            {getPaymentMethodIcon(payment.payment_method)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Salary Payment</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Payment for {staffName} - {formatCurrency(payment.net_salary)}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-purple-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Status: {payment.payment_status}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Method: {payment.payment_method.replace('_', ' ')}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date: {formatDateTime(payment.payment_date)}</span>
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
            <Link
              href={`/salary-management/payments/${payment.id}/edit`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Edit Payment
          </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Net Salary
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(payment.net_salary)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                Final Amount
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Base Salary
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(payment.base_salary)}
              </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Base Amount
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Allowances
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(payment.allowances)}
              </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Added
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Deductions
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <MinusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(payment.deductions)}
              </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                Subtracted
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Core details about this salary payment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff Member</p>
                <p className="text-gray-900 font-semibold">{staffName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Salary Period</p>
                <p className="text-gray-900">{payment.salary_period_name}</p>
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
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Financial Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Salary breakdown and calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Base Salary</p>
                <p className="text-gray-900 font-semibold">{formatCurrency(payment.base_salary)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Allowances</p>
                <p className="text-gray-900 text-green-600 font-semibold">+{formatCurrency(payment.allowances)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="text-gray-900 text-red-600 font-semibold">-{formatCurrency(payment.deductions)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Salary</p>
                <p className="text-gray-900 font-bold text-lg">{formatCurrency(payment.net_salary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Information */}
      {payment.transaction_reference && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Transaction Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Payment transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaction Reference</p>
                <p className="text-gray-900 font-mono">{payment.transaction_reference}</p>
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
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Notes</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Additional notes about this payment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-900">{payment.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>System Information</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common actions for this salary payment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Link href={`/salary-management/payments/${payment.id}/edit`}>
              <Button className="flex items-center space-x-2">
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