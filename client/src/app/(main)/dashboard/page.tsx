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
  BarChart3,
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle,
  TrendingDown,
  Activity,
  Zap
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-blue-100">
                Loading your school dashboard...
              </p>
            </div>
          </div>
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-blue-100">
                Here's an overview of school operations and financial activities today.
              </p>
            </div>
          </div>
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
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`,
      gradient: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats?.totalExpenses || 0),
      change: "Current Term",
      changeType: "negative" as const,
      icon: TrendingDown,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`,
      gradient: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600"
    },
    {
      title: "Collected Fees",
      value: formatCurrency(stats?.collectedFees || 0),
      change: "Current Term",
      changeType: "positive" as const,
      icon: CreditCard,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`,
      gradient: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Net Income",
      value: formatCurrency(stats?.netIncome || 0),
      change: stats?.netIncome && stats.netIncome >= 0 ? "Profit" : "Loss",
      changeType: stats?.netIncome && stats.netIncome >= 0 ? "positive" as const : "negative" as const,
      icon: BarChart3,
      description: `${stats?.currentTermName} (${stats?.currentAcademicYear})`,
      gradient: stats?.netIncome && stats.netIncome >= 0 ? "from-green-500 to-emerald-500" : "from-orange-500 to-red-500",
      bgColor: stats?.netIncome && stats.netIncome >= 0 ? "bg-green-50" : "bg-orange-50",
      iconColor: stats?.netIncome && stats.netIncome >= 0 ? "text-green-600" : "text-orange-600"
    }
  ];

  const quickActions = [
    {
      title: "Create Expense",
      description: "Add a new expense record",
      href: "/expenses/create",
      icon: CreditCard,
      gradient: "from-blue-500 to-indigo-500",
      hoverGradient: "from-blue-600 to-indigo-600"
    },
    {
      title: "View Reports",
      description: "Access financial reports",
      href: "/reports",
      icon: FileText,
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "from-green-600 to-emerald-600"
    },
    {
      title: "Manage Categories",
      description: "Organize expense categories",
      href: "/categories",
      icon: Tags,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Department Setup",
      description: "Configure departments",
      href: "/departments",
      icon: Building2,
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "from-orange-600 to-red-600"
    }
  ];

  const additionalStats = [
    {
      title: "Pending Approvals",
      value: stats?.pendingExpenses || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Expenses awaiting review"
    },
    {
      title: "Active Vendors",
      value: stats?.totalVendors || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Registered vendors"
    },
    {
      title: "Collection Rate",
      value: stats?.expectedFees && stats.expectedFees > 0 
        ? `${((stats.collectedFees / stats.expectedFees) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Fees collected vs expected"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.first_name}!
            </h1>
            <p className="text-blue-100 text-lg">
              Here's an overview of Pallisa High School operations and financial activities today.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-blue-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Current Term: {stats?.currentTermName}</span>
          </div>
          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{stats?.currentAcademicYear}</span>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span 
                  className={`font-medium px-2 py-1 rounded-full ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 
                    stat.changeType === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="hidden sm:inline">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {additionalStats.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Frequently used actions for school administration and expense management
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="group p-4 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{action.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Recent Expenses</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest expense submissions
                </CardDescription>
              </div>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent expenses</h3>
                <p className="text-gray-600 mb-6">No expenses have been recorded yet.</p>
                <Link href="/expenses/create">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{expense.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">{expense.category}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{formatDate(expense.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                      {getStatusBadge(expense.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>System Overview</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Current system status and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-green-900">All Systems Operational</p>
                  <p className="text-sm text-green-700">Everything is running smoothly</p>
                </div>
              </div>
              
              {stats?.pendingExpenses && stats.pendingExpenses > 0 && (
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-yellow-900">{stats.pendingExpenses} Pending Approvals</p>
                    <p className="text-sm text-yellow-700">Expenses awaiting review</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-blue-900">Monthly Report Due</p>
                  <p className="text-sm text-blue-700">Financial report due in 3 days</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-purple-50 border border-purple-200">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-purple-900">Academic Progress</p>
                  <p className="text-sm text-purple-700">Term progress tracking active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 