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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Expense</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/expenses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Expenses
          </Link>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Expense Not Found</h1>
          <p className="text-gray-600 mb-6">The expense you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/expenses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Expenses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/expenses"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Expenses
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{expense.title}</h1>
              <p className="mt-2 text-gray-600">{expense.description}</p>
            </div>
            <span className={getStatusBadge(expense.status)}>
              {expense.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Amount</h2>
              <div className="text-4xl font-bold text-gray-900">
                {formatCurrency(expense.amount)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Payment method: {expense.payment_method.replace('_', ' ')}
              </p>
              {expense.invoice_number && (
                <p className="text-sm text-gray-500">
                  Invoice: {expense.invoice_number}
                </p>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-sm text-gray-900">{expense.category.name}</p>
                  {expense.category.description && (
                    <p className="text-xs text-gray-500">{expense.category.description}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {expense.department ? expense.department.name : 'Not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vendor</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {expense.vendor ? expense.vendor.name : 'Not specified'}
                  </p>
                  {expense.vendor?.contact && (
                    <p className="text-xs text-gray-500">Contact: {expense.vendor.contact}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Academic Term</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {expense.term ? `${expense.term.name} (${expense.term.academic_year})` : 'Not specified'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Incurred</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(expense.incurred_on)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Recorded</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(expense.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Receipt Card */}
            {expense.receipt_url && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Receipt</h2>
                <div className="relative">
                  <Image
                    src={expense.receipt_url}
                    alt="Expense receipt"
                    width={300}
                    height={400}
                    className="rounded-md border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowReceiptModal(true)}
                  />
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-md hover:bg-opacity-70 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {canEdit && (
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Expense
                  </Link>
                )}

                {canApprove && (
                  <button
                    onClick={() => handleApprove(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve Expense
                  </button>
                )}

                {expense.approved && (
                  <button
                    onClick={() => handleApprove(false)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Disapprove Expense
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Expense
                  </button>
                )}
              </div>
            </div>

            {/* Audit Trail Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Recorded By</h3>
                  <p className="mt-1 text-sm text-gray-900">{expense.recorded_by?.full_name}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(expense.created_at)}</p>
                </div>

                {expense.approved && expense.approved_by && expense.approved_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Approved By</h3>
                    <p className="mt-1 text-sm text-gray-900">{expense.approved_by.full_name}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(expense.approved_at)}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(expense.updated_at)}</p>
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

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Receipt</h3>
                    <button
                      onClick={() => setShowReceiptModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Image
                    src={expense.receipt_url}
                    alt="Expense receipt"
                    width={500}
                    height={600}
                    className="w-full h-auto rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 