"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface StudentFeeBalance {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  class_name: string;
  academic_year: number;
  academic_year_name: string;
  term: number;
  term_name: string;
  total_expected: string;
  total_paid: string;
  total_discounts: string;
  total_pending: string;
  balance_status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  payment_percentage: string;
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'student_name' | 'class_name' | 'total_expected' | 'total_paid' | 'total_pending' | 'balance_status' | 'payment_percentage';
type SortOrder = 'asc' | 'desc';

export default function StudentFeeBalancesPage() {
  const [balances, setBalances] = useState<StudentFeeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('student_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<StudentFeeBalance[]>(API_ENDPOINTS.FEES + 'balances/');
      setBalances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to load student fee balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-gray-600" /> : 
      <ArrowDown className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-0">Fully Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Partially Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800 border-0">Unpaid</Badge>;
      case 'overpaid':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Overpaid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return 'UGX 0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  const formatPercentage = (percentage: string) => {
    if (!percentage) return '0%';
    return `${parseFloat(percentage).toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    fetchBalances();
  };

  // Filter balances based on search term
  const filteredBalances = balances.filter(balance =>
    balance.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.academic_year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.term_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort balances
  const sortedBalances = [...filteredBalances].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'student_name':
        aValue = a.student_name || '';
        bValue = b.student_name || '';
        break;
      case 'class_name':
        aValue = a.class_name || '';
        bValue = b.class_name || '';
        break;
      case 'total_expected':
        aValue = parseFloat(a.total_expected) || 0;
        bValue = parseFloat(b.total_expected) || 0;
        break;
      case 'total_paid':
        aValue = parseFloat(a.total_paid) || 0;
        bValue = parseFloat(b.total_paid) || 0;
        break;
      case 'total_pending':
        aValue = parseFloat(a.total_pending) || 0;
        bValue = parseFloat(b.total_pending) || 0;
        break;
      case 'balance_status':
        aValue = a.balance_status || '';
        bValue = b.balance_status || '';
        break;
      case 'payment_percentage':
        aValue = parseFloat(a.payment_percentage) || 0;
        bValue = parseFloat(b.payment_percentage) || 0;
        break;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Calculate statistics
  const stats = {
    totalStudents: balances.length,
    fullyPaid: balances.filter(b => b.balance_status === 'paid').length,
    partiallyPaid: balances.filter(b => b.balance_status === 'partial').length,
    unpaid: balances.filter(b => b.balance_status === 'unpaid').length,
    totalExpected: balances.reduce((sum, b) => sum + parseFloat(b.total_expected || '0'), 0),
    totalPaid: balances.reduce((sum, b) => sum + parseFloat(b.total_paid || '0'), 0),
    totalPending: balances.reduce((sum, b) => sum + parseFloat(b.total_pending || '0'), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Fee Balances</h1>
              <p className="text-gray-600 mt-1">Track and manage all student fee balances</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fully Paid</p>
                  <p className="text-2xl font-bold text-green-600">{stats.fullyPaid}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Partially Paid</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.partiallyPaid}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unpaid</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expected</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpected.toString())}</p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid.toString())}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalPending.toString())}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border border-gray-100 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, ID, class, year, or term..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border border-red-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balances Table */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Student Fee Balances ({filteredBalances.length})
            </CardTitle>
            <CardDescription>
              {searchTerm ? 'Filtered balance records' : 'All student fee balance records'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading balances...</span>
              </div>
            ) : filteredBalances.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No balances found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No student fee balances available.'}
                </p>
              </div>
            ) : (
              <div className="w-full">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-3">
                        <button
                          onClick={() => handleSort('student_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Student</span>
                          {getSortIcon('student_name')}
                        </button>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => handleSort('class_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Class</span>
                          {getSortIcon('class_name')}
                        </button>
                      </div>
                      <div className="col-span-1">Year</div>
                      <div className="col-span-1">Term</div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_expected')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Expected</span>
                          {getSortIcon('total_expected')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_paid')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Paid</span>
                          {getSortIcon('total_paid')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_pending')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Pending</span>
                          {getSortIcon('total_pending')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('payment_percentage')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Progress</span>
                          {getSortIcon('payment_percentage')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('balance_status')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Status</span>
                          {getSortIcon('balance_status')}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {sortedBalances.map((balance) => (
                      <div key={balance.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50">
                        <div className="col-span-3">
                          <div>
                            <div className="font-medium text-gray-900 text-sm truncate">{balance.student_name}</div>
                            <div className="text-xs text-gray-500">{balance.student_id}</div>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm text-gray-900 truncate">{balance.class_name}</div>
                        <div className="col-span-1 text-sm text-gray-900">{balance.academic_year}</div>
                        <div className="col-span-1 text-sm text-gray-900">{balance.term_name}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(balance.total_expected)}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(balance.total_paid)}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(balance.total_pending)}</div>
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, parseFloat(balance.payment_percentage || '0'))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{formatPercentage(balance.payment_percentage)}</span>
                          </div>
                        </div>
                        <div className="col-span-1">{getStatusBadge(balance.balance_status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 