'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { Plus, DollarSign, Users, TrendingUp, Calendar, FileText, BarChart3, CreditCard, Calculator, TrendingDown, Settings, Activity, RefreshCw } from 'lucide-react';
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Salary Management</h1>
            <p className="text-orange-100 text-base sm:text-lg">
              Manage staff salaries, allowances, deductions, and payments
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-orange-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Staff: {summary?.total_staff || 0}</span>
            </div>
            <div className="w-1 h-1 bg-orange-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Budget: {summary ? formatCurrency(summary.total_salary_budget) : '0'}</span>
            </div>
            <div className="w-1 h-1 bg-orange-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Rate: {summary?.payment_completion_rate || 0}%</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Button
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              href="/salary-management/payments/create"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              New Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Staff */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Staff
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{summary?.total_staff || 0}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Teaching & Non-Teaching
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Salary Budget */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Budget
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {summary ? formatCurrency(summary.total_salary_budget) : '0'}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  All Staff Salaries
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Paid This Month */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Paid This Period
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {summary ? formatCurrency(summary.total_paid_this_month) : '0'}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Active Period
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Completion Rate */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Completion Rate
              </CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {summary?.payment_completion_rate || 0}%
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Paid vs Budget
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Salary Tracking Overview */}
      {!loading && summary && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <span>Salary Tracking Overview</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Detailed breakdown of salary budget and payment tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Budget Breakdown */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Budget Breakdown</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Total Budget</span>
                    <span className="font-semibold text-sm sm:text-base">{formatCurrency(summary.total_salary_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Average Salary</span>
                    <span className="font-semibold text-sm sm:text-base">{formatCurrency(summary.average_salary)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Staff Count</span>
                    <span className="font-semibold text-sm sm:text-base">{summary.total_staff}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Payment Status</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Paid Amount</span>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">{formatCurrency(summary.total_paid_this_month)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Pending Amount</span>
                    <span className="font-semibold text-yellow-600 text-sm sm:text-base">{formatCurrency(summary.total_pending_payments)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Remaining</span>
                    <span className="font-semibold text-red-600 text-sm sm:text-base">
                      {formatCurrency(summary.total_salary_budget - summary.total_paid_this_month)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Progress</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      {summary.payment_completion_rate}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Salary Periods */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Salary Periods</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Manage salary periods and payment schedules
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Create and manage salary periods for monthly and termly payments
              </p>
              <Link href="/salary-management/periods">
                <Button variant="outline" className="w-full text-sm">
                  Manage Periods
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Allowances */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span>Salary Allowances</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure and manage salary allowances
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Set up housing, transport, medical, and other allowances
              </p>
              <Link href="/salary-management/allowances">
                <Button variant="outline" className="w-full text-sm">
                  Manage Allowances
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Deductions */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span>Salary Deductions</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure and manage salary deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Set up taxes, loans, advances, and other deductions
              </p>
              <Link href="/salary-management/deductions">
                <Button variant="outline" className="w-full text-sm">
                  Manage Deductions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Salary Payments */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span>Salary Payments</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Process and manage salary payments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Process payments, view payment history, and generate reports
              </p>
              <Link href="/salary-management/payments">
                <Button variant="outline" className="w-full text-sm">
                  Manage Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              <span>Salary Reports</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Generate and view salary reports
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                View detailed reports and analytics for salary management
              </p>
              <Link href="/salary-management/reports">
                <Button variant="outline" className="w-full text-sm">
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-slate-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <span>Settings</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure salary management settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Configure payment methods, tax rates, and other settings
              </p>
              <Link href="/salary-management/settings">
                <Button variant="outline" className="w-full text-sm">
                  Manage Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                <span>Recent Salary Payments</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest salary payments and activities
              </CardDescription>
            </div>
            <Link href="/salary-management/payments">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loadingPayments ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <p className="text-center text-gray-500 text-sm sm:text-base">No recent salary payments found.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                      {getPaymentMethodIcon(payment.payment_method)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{payment.staff_name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {payment.staff_type.charAt(0).toUpperCase() + payment.staff_type.slice(1)} - {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(payment.net_salary)}</p>
                    <Badge className={`${getPaymentStatusColor(payment.payment_status)} text-xs`}>
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