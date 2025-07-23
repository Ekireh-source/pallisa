'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Plus, DollarSign, Users, TrendingUp, Calendar, FileText, BarChart3, CreditCard, Calculator, TrendingDown, Settings } from 'lucide-react';
import Link from 'next/link';
import { getSalaryDashboardSummary, getRecentSalaryPayments, getSalaryPayments } from '@/lib/api';
import { SalaryPayment } from '@/types';
import { toast } from 'sonner';

interface SalarySummary {
  total_staff: number;
  total_salary_budget: number;
  total_paid_this_month: number;
  total_pending_payments: number;
  average_salary: number;
  payment_completion_rate: number;
}

export default function SalaryManagementPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);

  console.log("recentPayments", recentPayments);
  console.log("summary", summary);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadingPayments(true);
      
      // Fetch summary data and recent payments in parallel
      const [summaryData, paymentsData, allPayments] = await Promise.all([
        getSalaryDashboardSummary(),
        getRecentSalaryPayments(5),
        getSalaryPayments()
      ]);

      console.log('Summary data:', summaryData);
      console.log('Payments data:', paymentsData);
      console.log('All payments:', allPayments);
      setSummary(summaryData);
      setRecentPayments(paymentsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set fallback data
      setSummary({
        total_staff: 0,
        total_salary_budget: 0,
        total_paid_this_month: 0,
        total_pending_payments: 0,
        average_salary: 0,
        payment_completion_rate: 0
      });
      setRecentPayments([]);
    } finally {
      setLoading(false);
      setLoadingPayments(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'mobile_money':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'check':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isAuthenticated) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600 mt-2">
            Manage staff salaries, allowances, deductions, and payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/salary-management/payments/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Payment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Staff */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{summary?.total_staff}</p>
                  <p className="text-xs text-gray-500 mt-1">Teaching & Non-Teaching</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Salary Budget */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary ? formatCurrency(summary.total_salary_budget) : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All Staff Salaries</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paid This Month */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid This Period</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary ? formatCurrency(summary.total_paid_this_month) : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Active Period</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Completion Rate */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.payment_completion_rate}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Paid vs Budget</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Salary Tracking Overview */}
      {!loading && summary && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Salary Tracking Overview</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of salary budget and payment tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Budget Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Budget Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="font-semibold">{formatCurrency(summary.total_salary_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Salary</span>
                    <span className="font-semibold">{formatCurrency(summary.average_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Staff Count</span>
                    <span className="font-semibold">{summary.total_staff}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Payment Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid Amount</span>
                    <span className="font-semibold text-green-600">{formatCurrency(summary.total_paid_this_month)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Amount</span>
                    <span className="font-semibold text-yellow-600">{formatCurrency(summary.total_pending_payments)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(summary.total_salary_budget - summary.total_paid_this_month)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Progress</h4>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {summary.payment_completion_rate}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(summary.payment_completion_rate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    {summary.total_paid_this_month > 0 ? 
                      `${formatCurrency(summary.total_paid_this_month)} of ${formatCurrency(summary.total_salary_budget)} paid` :
                      'No payments made yet'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Salary Periods */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Salary Periods</span>
            </CardTitle>
            <CardDescription>
              Manage salary periods and payment schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Create and manage salary periods for monthly and termly payments
              </p>
              <Link href="/salary-management/periods">
                <Button variant="outline" className="w-full">
                  Manage Periods
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Allowances */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-600" />
              <span>Salary Allowances</span>
            </CardTitle>
            <CardDescription>
              Configure and manage salary allowances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Set up housing, transport, medical, and other allowances
              </p>
              <Link href="/salary-management/allowances">
                <Button variant="outline" className="w-full">
                  Manage Allowances
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Deductions */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span>Salary Deductions</span>
            </CardTitle>
            <CardDescription>
              Configure and manage salary deductions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Set up taxes, loans, advances, and other deductions
              </p>
              <Link href="/salary-management/deductions">
                <Button variant="outline" className="w-full">
                  Manage Deductions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Payments */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <span>Salary Payments</span>
            </CardTitle>
            <CardDescription>
              Process and manage salary payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Process payments, view payment history, and generate reports
              </p>
              <Link href="/salary-management/payments">
                <Button variant="outline" className="w-full">
                  Manage Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Salary Reports</span>
            </CardTitle>
            <CardDescription>
              Generate and view salary reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                View detailed reports and analytics for salary management
              </p>
              <Link href="/salary-management/reports">
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Settings</span>
            </CardTitle>
            <CardDescription>
              Configure salary management settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Configure payment methods, tax rates, and other settings
              </p>
              <Link href="/salary-management/settings">
                <Button variant="outline" className="w-full">
                  Manage Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Salary Payments</CardTitle>
              <CardDescription>
                Latest salary payments and activities
              </CardDescription>
            </div>
            <Link href="/salary-management/payments">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-center text-gray-500">No recent salary payments found.</p>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.staff_name}</p>
                      <p className="text-sm text-gray-600">
                        {payment.staff_type.charAt(0).toUpperCase() + payment.staff_type.slice(1)} - {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(payment.net_salary)}</p>
                    <Badge className={`${getPaymentStatusColor(payment.payment_status)}`}>
                      {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 