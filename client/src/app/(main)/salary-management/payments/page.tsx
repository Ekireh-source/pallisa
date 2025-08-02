'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { Plus, Search, Filter, Edit, Trash2, Eye, DollarSign, CreditCard, Wallet, Activity, FileText, RefreshCw, Upload } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPayments, deleteSalaryPayment } from '@/lib/api';
import { SalaryPayment } from '@/types';
import { toast } from 'sonner';

export default function SalaryPaymentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<SalaryPayment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPayments();
  }, [isAuthenticated, router]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getSalaryPayments();
      setPayments(data);
      console.log(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load salary payments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;

    try {
      setDeleting(true);
      await deleteSalaryPayment(deletingPayment.id);
      toast.success('Salary payment deleted successfully');
      setPayments(prev => prev.filter(p => p.id !== deletingPayment.id));
      setShowDeleteModal(false);
      setDeletingPayment(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete salary payment');
    } finally {
      setDeleting(false);
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'cash':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'mobile_money':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'check':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.payment_status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMethod('all');
    setShowFilters(false);
  };

  // Calculate statistics
  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.payment_status === 'completed').length;
  const pendingPayments = payments.filter(p => p.payment_status === 'pending').length;
  const totalAmount = payments.reduce((sum, p) => sum + p.net_salary, 0);

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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Salary Payments</h1>
            <p className="text-purple-100 text-base sm:text-lg">
              Manage salary payments for staff members
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-purple-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Total: {totalPayments}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Paid: {paidPayments}</span>
            </div>
            <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Amount: {formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Button
              onClick={() => {/* TODO: Add bulk upload functionality */}}
              disabled={loading}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Bulk Upload
            </Button>
            <Link
              href="/salary-management/payments/create"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Payment
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Payments
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{totalPayments}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                All Payments
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Paid Payments
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{paidPayments}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                Completed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pending Payments
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{pendingPayments}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Awaiting
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Amount
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{formatCurrency(totalAmount)}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Net Salary
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span>Search Payments</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find payments by staff name or reference
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPayments}
                className="flex items-center space-x-2 text-xs sm:text-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by name or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <Button onClick={() => {/* TODO: Implement search */}} className="flex items-center space-x-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={filterMethod}
                      onChange={(e) => setFilterMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All methods</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center space-x-2"
                    >
                      <span>Clear All Filters</span>
                    </Button>
                  </div>
                  <Button
                    onClick={() => {/* TODO: Apply filters */}}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span>Salary Payments ({filteredPayments.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            List of all salary payments for staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' || filterMethod !== 'all'
                  ? 'No payments found matching your criteria'
                  : 'No payments found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || filterMethod !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first salary payment'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {(searchTerm || filterStatus !== 'all' || filterMethod !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <span>Clear Filters</span>
                  </Button>
                )}
                {!searchTerm && filterStatus === 'all' && filterMethod === 'all' && (
                  <Link href="/salary-management/payments/create" className="w-full sm:w-auto">
                    <Button className="flex items-center space-x-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      <span>Create First Payment</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Name
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Period
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Net Salary
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Base Salary
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="text-sm text-gray-900">
                            {payment.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.staff_name}
                          </div>
                          {payment.transaction_reference && (
                            <div className="text-xs text-gray-500">
                              Ref: {payment.transaction_reference}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 md:hidden">
                            {formatDate(payment.payment_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden md:table-cell">
                        <Badge className={getPaymentStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {payment.salary_period_name}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.net_salary)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-600">
                          {formatCurrency(payment.base_salary)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/salary-management/payments/${payment.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/salary-management/payments/${payment.id}/edit`)}
                            className="flex items-center space-x-1 px-2 py-1 h-8"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingPayment(payment);
                              setShowDeleteModal(true);
                            }}
                            className="flex items-center space-x-1 px-2 py-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingPayment(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Payment"
        message={`Are you sure you want to delete this salary payment? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
} 