'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchExpenseById, 
  approveExpense,
  deleteExpense,
  clearCurrentExpense
} from '@/store/slices/expenseSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  X, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Building2,
  Store,
  FolderOpen,
  User,
  Clock as TimeIcon
} from 'lucide-react';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const id = parseInt(params.id as string);
  
  // Redux state with defensive checks
  const expenseState = useAppSelector(state => state.expenses);
  const authState = useAppSelector(state => state.auth);

  // Destructure with fallback values
  const { currentExpense: expense, loading = false, error = null } = expenseState || {};
  const { user } = authState || {};
  
  // Local state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load expense data on component mount
  useEffect(() => {
    if (id) {
      dispatch(fetchExpenseById(id));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentExpense());
    };
  }, [dispatch, id]);

  // Handle approval
  const handleApprove = async (approved: boolean) => {
    if (!expense) return;
    
    try {
      await dispatch(approveExpense({ id: expense.id, approved })).unwrap();
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!expense) return;
    
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(expense.id)).unwrap();
        router.push('/expenses');
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  // Helper functions
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    if (status === 'Approved') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`;
  };

  // Permission checks
  const canApprove = user && expense && user.id !== expense.recorded_by.id && !expense.approved;
  const canEdit = user && expense && user.id === expense.recorded_by.id && !expense.approved;
  const canDelete = user && expense && user.id === expense.recorded_by.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <X className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Expense
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Expense</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/expenses"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Expenses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Expense Not Found
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Expense Not Found</h1>
            <p className="text-gray-600 mb-6">The expense you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/expenses"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Expenses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{expense.title}</h1>
            <p className="text-blue-100 text-lg">{expense.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={getStatusBadge(expense.status)}>
              {expense.status}
            </span>
            <Link
              href="/expenses"
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Expenses
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Amount Details
              </h3>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {formatCurrency(expense.amount)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Method</p>
                    <p className="text-sm text-gray-600">{expense.payment_method.replace('_', ' ')}</p>
                  </div>
                </div>
                {expense.invoice_number && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Invoice Number</p>
                      <p className="text-sm text-gray-600">{expense.invoice_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Expense Details
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-sm font-semibold text-gray-900">{expense.category.name}</p>
                    {expense.category.description && (
                      <p className="text-xs text-gray-600">{expense.category.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {expense.department ? expense.department.name : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendor</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {expense.vendor ? expense.vendor.name : 'Not specified'}
                    </p>
                    {expense.vendor?.contact && (
                      <p className="text-xs text-gray-600">Contact: {expense.vendor.contact}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Academic Term</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {expense.term ? `${expense.term.name} (${expense.term.academic_year})` : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date Incurred</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(expense.incurred_on)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TimeIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date Recorded</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(expense.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Card */}
          {expense.receipt_url && (
            <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Receipt
                </h3>
              </div>
              <div className="p-6">
                <div className="relative">
                  <Image
                    src={expense.receipt_url}
                    alt="Expense receipt"
                    width={300}
                    height={400}
                    className="rounded-xl border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowReceiptModal(true)}
                  />
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="absolute top-3 right-3 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-opacity"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-blue-600" />
                Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {canEdit && (
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Expense
                  </Link>
                )}

                {canApprove && (
                  <button
                    onClick={() => handleApprove(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Expense
                  </button>
                )}

                {expense.approved && (
                  <button
                    onClick={() => handleApprove(false)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disapprove Expense
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-red-300 text-red-700 bg-white rounded-xl font-semibold hover:bg-red-50 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Expense
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail Card */}
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Audit Trail
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recorded By</p>
                    <p className="text-sm font-semibold text-gray-900">{expense.recorded_by?.full_name}</p>
                    <p className="text-xs text-gray-600">{formatDateTime(expense.created_at)}</p>
                  </div>
                </div>

                {expense.approved && expense.approved_by && expense.approved_at && (
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Approved By</p>
                      <p className="text-sm font-semibold text-gray-900">{expense.approved_by.full_name}</p>
                      <p className="text-xs text-gray-600">{formatDateTime(expense.approved_at)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TimeIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-xs text-gray-600">{formatDateTime(expense.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && expense.receipt_url && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowReceiptModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Receipt</h3>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <Image
                  src={expense.receipt_url}
                  alt="Expense receipt"
                  width={500}
                  height={600}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 