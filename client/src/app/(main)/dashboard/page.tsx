'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileText,
  AlertCircle,
  Building2,
  Users,
  Tags,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { 
  expenseApi, 
  vendorApi, 
  studentApi, 
  teacherApi,
  apiGet,
  API_ENDPOINTS 
} from '@/lib/api';

interface DashboardStats {
  totalExpenses: number;
  pendingExpenses: number;
  totalVendors: number;
  monthlyExpenses: number;
  totalStudents: number;
  totalTeachers: number;
  totalFeePayments: number;
  totalFeeAmount: number;
  // New fields for term-specific financial data
  expectedFees: number;
  collectedFees: number;
  netIncome: number;
  currentTermName: string;
  currentAcademicYear: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category_name?: string;
  created_at: string;
  status: string;
}

interface FeePayment {
  id: number;
  amount_paid: string;
  created_at: string;
}

interface Term {
  id: number;
  name: string;
  is_current: boolean;
  academic_year: number;
  academic_year_name: string;
}

interface FeeCollectionSummary {
  id: number;
  term: number;
  academic_year: number;
  total_expected_with_overrides: string;
  total_collected: string;
}

interface RecentExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel
      const [
        expensesResponse,
        vendorsResponse,
        studentsResponse,
        teachersResponse,
        feePayments,
        expenseSummary,
        termsResponse,
        feeCollectionSummariesResponse
      ] = await Promise.all([
        expenseApi.getAll({ page_size: 5 }), // Recent expenses
        vendorApi.getAll(),
        studentApi.getAll(),
        teacherApi.getAll(),
        apiGet<{ results: FeePayment[] }>(API_ENDPOINTS.FEES + 'payments/'),
        expenseApi.getSummary(),
        apiGet<{ results: Term[] }>(API_ENDPOINTS.TERMS),
        apiGet<{ results: FeeCollectionSummary[] }>(API_ENDPOINTS.FEES + 'collection-summaries/')
      ]);

      // Extract terms from paginated response
      const terms = termsResponse.results || [];
      
      // Extract fee collection summaries from paginated response
      const feeCollectionSummaries = feeCollectionSummariesResponse.results || [];
      
      // Get current term
      const currentTerm = terms.find(term => term.is_current);
      
      // Get current term's fee collection summary
      const currentTermSummary = currentTerm ? feeCollectionSummaries.find(summary => 
        Number(summary.term) === Number(currentTerm.id) && Number(summary.academic_year) === Number(currentTerm.academic_year)
      ) : null;

      // Handle paginated response for expenses
      let expenses: Expense[] = [];
      if (expensesResponse && typeof expensesResponse === 'object' && 'results' in expensesResponse) {
        expenses = (expensesResponse as { results: Expense[] }).results || [];
      } else if (Array.isArray(expensesResponse)) {
        expenses = expensesResponse;
      } else {
        console.warn('Unexpected expenses response structure:', expensesResponse);
        expenses = [];
      }

      // Handle paginated responses for vendors, students, and teachers
      const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : [];
      const students = Array.isArray(studentsResponse) ? studentsResponse : [];
      const teachers = Array.isArray(teachersResponse) ? teachersResponse : [];

      // Calculate statistics
      const totalExpenseAmount = expenses.reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0);
      const pendingExpenses = expenses.filter((e: Expense) => e.status === 'Pending Approval').length;
      const totalVendors = vendors.length;
      const totalStudents = students.length;
      const totalTeachers = teachers.length;
      const totalFeePayments = feePayments.results?.length || 0;
      
      // Calculate total amounts
      const totalFeeAmount = (feePayments.results || []).reduce((sum: number, p: FeePayment) => sum + parseFloat(p.amount_paid || '0'), 0);
      
      // Get monthly expenses from summary
      const monthlyExpenses = expenseSummary?.total_expenses || totalExpenseAmount;

      // Calculate term-specific financial data
      const expectedFees = currentTermSummary ? parseFloat(currentTermSummary.total_expected_with_overrides || '0') : 0;
      const collectedFees = currentTermSummary ? parseFloat(currentTermSummary.total_collected || '0') : 0;
      const netIncome = collectedFees - totalExpenseAmount;

      setStats({
        totalExpenses: totalExpenseAmount,
        pendingExpenses,
        totalVendors,
        monthlyExpenses,
        totalStudents,
        totalTeachers,
        totalFeePayments,
        totalFeeAmount,
        expectedFees,
        collectedFees,
        netIncome,
        currentTermName: currentTerm?.name || 'No Current Term',
        currentAcademicYear: currentTerm?.academic_year_name || 'N/A'
      });

      // Set recent expenses
      const recent = expenses.slice(0, 5).map((expense: Expense) => ({
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category_name || 'Uncategorized',
        created_at: expense.created_at,
        status: expense.status
      }));

      setRecentExpenses(recent);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Approved') {
      return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;
    }
    if (status === 'Pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back to Pallisa High School, {user.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Loading dashboard data...
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back to Pallisa High School, {user.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s an overview of school operations and financial activities today.
          </p>
        </div>
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button 
              onClick={fetchDashboardData} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Expected Fees",
      value: formatCurrency(stats?.expectedFees || 0),
      change: "Current Term",
      changeType: "neutral" as const,
      icon: DollarSign,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats?.totalExpenses || 0),
      change: "Current Term",
      changeType: "negative" as const,
      icon: TrendingUp,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`
    },
    {
      title: "Collected Fees",
      value: formatCurrency(stats?.collectedFees || 0),
      change: "Current Term",
      changeType: "positive" as const,
      icon: CreditCard,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`
    },
    {
      title: "Net Income",
      value: formatCurrency(stats?.netIncome || 0),
      change: stats?.netIncome && stats.netIncome >= 0 ? "Profit" : "Loss",
      changeType: stats?.netIncome && stats.netIncome >= 0 ? "positive" as const : "negative" as const,
      icon: BarChart3,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`
    }
  ];

  const quickActions = [
    {
      title: "Create Expense",
      description: "Add a new expense record",
      href: "/expenses/create",
      icon: CreditCard,
      color: "bg-blue-500"
    },
    {
      title: "View Reports",
      description: "Access financial reports",
      href: "/reports",
      icon: FileText,
      color: "bg-green-500"
    },
    {
      title: "Manage Categories",
      description: "Organize expense categories",
      href: "/categories",
      icon: Tags,
      color: "bg-purple-500"
    },
    {
      title: "Department Setup",
      description: "Configure departments",
      href: "/departments",
      icon: Building2,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back to Pallisa High School, {user.first_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of school operations and financial activities today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm border border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span 
                  className={`font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Approvals
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingExpenses || 0}</div>
            <p className="text-xs text-gray-500">Expenses awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Vendors
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</div>
            <p className="text-xs text-gray-500">Registered vendors</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Collection Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.expectedFees && stats.expectedFees > 0 
                ? `${((stats.collectedFees / stats.expectedFees) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-gray-500">Fees collected vs expected</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          <CardDescription>
            Frequently used actions for school administration and expense management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Expenses</CardTitle>
              <CardDescription>Latest expense submissions</CardDescription>
            </div>
            <Link href="/expenses">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent expenses</h3>
                <p className="text-gray-600 mb-4">No expenses have been recorded yet.</p>
                <Link href="/expenses/create">
                  <Button size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{expense.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{expense.category}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatDate(expense.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 text-sm">{formatCurrency(expense.amount)}</span>
                      {getStatusBadge(expense.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">System Overview</CardTitle>
            <CardDescription>Current system status and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-green-900 text-sm">All Systems Operational</p>
                  <p className="text-xs text-green-700">Everything is running smoothly</p>
                </div>
              </div>
              
              {stats?.pendingExpenses && stats.pendingExpenses > 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900 text-sm">{stats.pendingExpenses} Pending Approvals</p>
                    <p className="text-xs text-yellow-700">Expenses awaiting review</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">Monthly Report Due</p>
                  <p className="text-xs text-blue-700">Financial report due in 3 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 