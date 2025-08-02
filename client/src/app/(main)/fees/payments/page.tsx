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
  Eye,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  Activity,
  Calendar,
} from 'lucide-react';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
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
      const data = await apiGet<FeePaymentStats>(`${API_ENDPOINTS.FEES}payments/stats/`);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [loadPayments]);

  const handlePageChange = (page: number) => {
    loadPayments(page, searchTerm);
  };

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    // TODO: Implement server-side sorting
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const handleSearch = () => {
    loadPayments(1, searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-0">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
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

  const MobilePaymentCard = ({ payment }: { payment: FeePayment }) => (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate">{payment.student_name}</h3>
        {getStatusBadge(payment.payment_status)}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(payment.amount_paid)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Category:</span>
          <span className="text-gray-900">{payment.category_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="text-gray-900">{formatDate(payment.payment_date)}</span>
        </div>
      </div>
      <div className="flex justify-end mt-3 space-x-2">
        <Link href={`/fees/payments/${payment.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Fee Payments</h1>
            <p className="text-blue-100 text-lg">
              Track and manage student fee payments with comprehensive oversight
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Payments: {totalCount}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Current Term</span>
            </div>
          </div>
          <Link
            href="/fees/payments/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record Payment
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_payments}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_payments}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_payments}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_amount)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search Payments
            </h3>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, category, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} payments
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {/* TODO: Implement export */}}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-600">Loading payments...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Payments</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {!loading && !error && payments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('student_name')}>
                      <div className="flex items-center space-x-1">
                        <span>Student</span>
                        {getSortIcon('student_name')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('category_name')}>
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category_name')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('amount_paid')}>
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        {getSortIcon('amount_paid')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('payment_date')}>
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('payment_date')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('payment_status')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('payment_status')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                        <div className="text-sm text-gray-500">{payment.academic_year_name} - {payment.term_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.category_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(payment.amount_paid)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.payment_status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/fees/payments/${payment.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-6">
            {payments.map((payment) => (
              <MobilePaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && payments.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600 mb-6">No payments match your current search criteria.</p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Clear Search
            </button>
            <Link
              href="/fees/payments/create"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Record First Payment
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 