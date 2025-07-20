'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchExpenseById, 
  updateExpense, 
  clearError,
  clearCurrentExpense
} from '@/store/slices/expenseSlice';
import { fetchExpenseCategories } from '@/store/slices/expenseCategorySlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { fetchTerms } from '@/store/slices/termSlice';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpenseCreateUpdate } from '@/types';

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const id = parseInt(params.id as string);

  // Redux state with defensive checks
  const expenseState = useAppSelector(state => state.expenses);
  const expenseCategoryState = useAppSelector(state => state.expenseCategories);
  const departmentState = useAppSelector(state => state.departments);
  const vendorState = useAppSelector(state => state.vendors);
  const termState = useAppSelector(state => state.terms);
  const authState = useAppSelector(state => state.auth);

  // Destructure with fallback values
  const { currentExpense: expense, loading = false, error = null, fieldErrors = {} } = expenseState || {};
  const { categories = [], loading: categoriesLoading = false } = expenseCategoryState || {};
  const { departments = [], loading: departmentsLoading = false } = departmentState || {};
  const { vendors = [], loading: vendorsLoading = false } = vendorState || {};
  const { terms = [], loading: termsLoading = false } = termState || {};
  const { user } = authState || {};

  // Load required data on component mount
  useEffect(() => {
    if (id) {
      dispatch(fetchExpenseById(id));
    }
    dispatch(fetchExpenseCategories());
    dispatch(fetchDepartments());
    dispatch(fetchVendors());
    dispatch(fetchTerms());
    
    // Clear any existing errors
    dispatch(clearError());

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentExpense());
    };
  }, [dispatch, id]);

  // Handle form submission
  const handleSubmit = async (data: ExpenseCreateUpdate) => {
    try {
      await dispatch(updateExpense({ id, data })).unwrap();
      // Redirect to expense detail on success
      router.push(`/expenses/${id}`);
    } catch (error) {
      // Error is handled by the reducer
      console.error('Failed to update expense:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/expenses/${id}`);
  };

  // Check permissions
  const canEdit = user && expense && user.id === expense.recorded_by.id && !expense.approved;

  // Show loading spinner while required data is loading
  const isInitialLoading = loading || categoriesLoading || departmentsLoading || vendorsLoading || termsLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle permission errors
  if (expense && !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            {expense.approved 
              ? "You cannot edit approved expenses."
              : "You can only edit expenses that you created."
            }
          </p>
          <div className="space-x-4">
            <Link
              href={`/expenses/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Expense
            </Link>
            <Link
              href="/expenses"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Expenses
            </Link>
          </div>
        </div>
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
          <p className="text-gray-600 mb-6">The expense you&apos;re trying to edit doesn&apos;t exist.</p>
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

  // Prepare initial data for the form
  const initialData: Partial<ExpenseCreateUpdate> = {
    title: expense.title,
    description: expense.description,
    amount: expense.amount,
    category: typeof expense.category === 'object' ? expense.category.id : expense.category,
    department: expense.department ? (typeof expense.department === 'object' ? expense.department.id : expense.department) : undefined,
    vendor: expense.vendor ? (typeof expense.vendor === 'object' ? expense.vendor.id : expense.vendor) : undefined,
    term: expense.term ? (typeof expense.term === 'object' ? expense.term.id : expense.term) : undefined,
    incurred_on: expense.incurred_on,
    invoice_number: expense.invoice_number,
    payment_method: expense.payment_method,
    // Note: receipt_image is not pre-filled as it's a file input
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={`/expenses/${id}`}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Expense
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
            <p className="mt-2 text-gray-600">
              Make changes to &quot;{expense.title}&quot;
            </p>
          </div>
        </div>

        {/* Warning about approved expenses */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Important Note
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Once an expense is approved, it cannot be edited. Make sure all information is correct before submitting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current receipt info */}
        {expense.receipt_url && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                This expense currently has a receipt attached. Upload a new image to replace it, or leave empty to keep the current one.
              </span>
            </div>
          </div>
        )}

        {/* Check if required data is available */}
        {categories.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No expense categories found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to have expense categories available to edit expenses.{' '}
                    <Link 
                      href="/expenses/categories" 
                      className="font-medium underline text-yellow-700 hover:text-yellow-600"
                    >
                      Manage categories here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Expense Form */
          <ExpenseForm
            initialData={initialData}
            categories={categories}
            departments={departments}
            vendors={vendors}
            terms={terms}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error || undefined}
            fieldErrors={fieldErrors}
          />
        )}
      </div>
    </div>
  );
} 