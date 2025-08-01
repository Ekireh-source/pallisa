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
import { 
  ArrowLeft, 
  Edit, 
  AlertTriangle, 
  FileText, 
  X, 
  Info,
  FolderOpen
} from 'lucide-react';

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
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <X className="w-5 h-5 mr-2 text-red-600" />
              Access Denied
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              {expense.approved 
                ? "You cannot edit approved expenses."
                : "You can only edit expenses that you created."
              }
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                href={`/expenses/${id}`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Expense
              </Link>
              <Link
                href="/expenses"
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Expenses
              </Link>
            </div>
          </div>
        </div>
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
            <p className="text-gray-600 mb-6">The expense you&apos;re trying to edit doesn&apos;t exist.</p>
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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Edit className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Edit Expense</h1>
            <p className="text-blue-100 text-lg">
              Make changes to &quot;{expense.title}&quot;
            </p>
          </div>
          <Link
            href={`/expenses/${id}`}
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Expense
          </Link>
        </div>
      </div>

      {/* Warning about approved expenses */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Important Note
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Approval Status
              </h3>
              <p className="text-sm text-blue-700">
                Once an expense is approved, it cannot be edited. Make sure all information is correct before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current receipt info */}
      {expense.receipt_url && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Current Receipt
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  This expense currently has a receipt attached. Upload a new image to replace it, or leave empty to keep the current one.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check if required data is available */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <FolderOpen className="w-5 h-5 mr-2 text-yellow-600" />
              No Expense Categories Found
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Categories Required
                </h3>
                <p className="text-sm text-yellow-700 mb-4">
                  You need to have expense categories available to edit expenses.
                </p>
                <Link 
                  href="/categories" 
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300"
                >
                  Manage Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Expense Form */
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Edit className="w-5 h-5 mr-2 text-blue-600" />
              Edit Expense Details
            </h3>
          </div>
          <div className="p-6">
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
          </div>
        </div>
      )}
    </div>
  );
} 