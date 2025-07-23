"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Download, 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Plus,
  XCircle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface FeePayment {
  id: number;
  student_name: string;
  category_name: string;
  academic_year_name: string;
  term_name: string;
  amount_paid: string;
  payment_status: string;
  payment_method: string;
  payment_date: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeePayment[];
  current_page: number;
  total_pages: number;
}

interface FeePaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  total_amount: string;
}

type SortField = 'student_name' | 'category_name' | 'amount_paid' | 'payment_date' | 'payment_status';
type SortOrder = 'asc' | 'desc';

export default function FeePaymentsPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('payment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Stats state
  const [stats, setStats] = useState<FeePaymentStats>({
    total_payments: 0,
    completed_payments: 0,
    pending_payments: 0,
    total_amount: '0',
  });

  // Load payments with pagination
  const loadPayments = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: itemsPerPage.toString(),
      });

      // Add search parameter if provided
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const url = `${API_ENDPOINTS.FEES}payments/?${params.toString()}`;
      const data = await apiGet<PaginatedResponse>(url);
      
      setPayments(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 0);
      setCurrentPage(data.current_page || 1);
      setError(null);
    } catch (err) {
        setError("Failed to load payments");
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, setLoading, setPayments, setTotalCount, setTotalPages, setCurrentPage, setError]);

  // Load stats
  const loadStats = async () => {
    try {
      const statsData = await apiGet<FeePaymentStats>(`${API_ENDPOINTS.FEES}payments/stats/`);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load payments on component mount
  useEffect(() => {
    loadPayments(1, searchTerm);
    loadStats();
  }, [loadPayments, searchTerm]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadPayments(1, searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadPayments]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadPayments(page, searchTerm);
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
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Client-side sorting for current page
  const sortedPayments = [...payments].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'student_name':
        aValue = a.student_name || '';
        bValue = b.student_name || '';
        break;
      case 'category_name':
        aValue = a.category_name || '';
        bValue = b.category_name || '';
        break;
      case 'amount_paid':
        aValue = parseFloat(a.amount_paid) || 0;
        bValue = parseFloat(b.amount_paid) || 0;
        break;
      case 'payment_date':
        aValue = new Date(a.payment_date).getTime();
        bValue = new Date(b.payment_date).getTime();
        break;
      case 'payment_status':
        aValue = a.payment_status || '';
        bValue = b.payment_status || '';
        break;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-0">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    loadPayments(currentPage, searchTerm);
    loadStats();
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Payments",
      value: stats.total_payments,
      color: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.completed_payments,
      color: "text-green-600"
    },
    {
      title: "Pending",
      value: stats.pending_payments,
      color: "text-yellow-600"
    },
    {
      title: "Total Amount",
      value: formatCurrency(stats.total_amount),
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Payments</h1>
              <p className="text-gray-600 mt-1">Track and manage all student fee payments</p>
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
              <Link href="/fees/payments/create">
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Payment</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                    placeholder="Search payments by student, category, year, or term..."
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
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments Table */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Fee Payments ({totalCount})
            </CardTitle>
            <CardDescription>
              {searchTerm ? 'Filtered payment records' : 'All payment records'}
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading payments...</span>
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by recording a new payment.'}
                </p>
                {!searchTerm && (
                  <Link href="/fees/payments/create">
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Payment</span>
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => handleSort('student_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Student</span>
                          {getSortIcon('student_name')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => handleSort('category_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Category</span>
                          {getSortIcon('category_name')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Academic Year</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Term</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => handleSort('amount_paid')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Amount</span>
                          {getSortIcon('amount_paid')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => handleSort('payment_date')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Date</span>
                          {getSortIcon('payment_date')}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <button
                          onClick={() => handleSort('payment_status')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Status</span>
                          {getSortIcon('payment_status')}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{payment.student_name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900">{payment.category_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600">{payment.academic_year_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600">{payment.term_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900">{formatCurrency(payment.amount_paid)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600 capitalize">{payment.payment_method.replace('_', ' ')}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600">{formatDate(payment.payment_date)}</span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(payment.payment_status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/fees/payments/${payment.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : totalCount > 0 ? (
              <div className="flex items-center justify-center border-t border-gray-200 pt-4 mt-6">
                <div className="text-sm text-gray-700">
                  Showing all {totalCount} results (single page)
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 