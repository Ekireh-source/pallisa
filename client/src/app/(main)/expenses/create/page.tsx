'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { createExpense, clearError } from '@/store/slices/expenseSlice';
import { fetchExpenseCategories } from '@/store/slices/expenseCategorySlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { fetchTerms } from '@/store/slices/termSlice';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpenseCreateUpdate } from '@/types';
import { ArrowLeft, Plus, FolderOpen, Building2, Store, Calendar } from 'lucide-react';

export default function CreateExpensePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state with defensive checks
  const expenseState = useAppSelector(state => state.expenses);
  const expenseCategoryState = useAppSelector(state => state.expenseCategories);
  const departmentState = useAppSelector(state => state.departments);
  const vendorState = useAppSelector(state => state.vendors);
  const termState = useAppSelector(state => state.terms);

  // Destructure with fallback values
  const { loading = false, error = null, fieldErrors = {} } = expenseState || {};
  const { categories = [], loading: categoriesLoading = false } = expenseCategoryState || {};
  const { departments = [], loading: departmentsLoading = false } = departmentState || {};
  const { vendors = [], loading: vendorsLoading = false } = vendorState || {};
  const { terms = [], loading: termsLoading = false } = termState || {};

  // Load required data on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
    dispatch(fetchDepartments());
    dispatch(fetchVendors());
    dispatch(fetchTerms());
    
    // Clear any existing errors
    dispatch(clearError());
  }, [dispatch]);

  // Helper function to get current term
  const getCurrentTerm = () => {
    const today = new Date();
    return terms.find(term => {
      const startDate = new Date(term.start_date);
      const endDate = new Date(term.end_date);
      return today >= startDate && today <= endDate;
    });
  };

  // Helper function to get the most recent term if no current term
  const getMostRecentTerm = () => {
    if (terms.length === 0) return null;
    
    // Sort terms by start date (most recent first)
    const sortedTerms = [...terms].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    return sortedTerms[0];
  };

  // Get default term for new expenses
  const getDefaultTerm = () => {
    const currentTerm = getCurrentTerm();
    if (currentTerm) return currentTerm.id;
    
    const mostRecentTerm = getMostRecentTerm();
    return mostRecentTerm?.id;
  };

  // Handle form submission
  const handleSubmit = async (data: ExpenseCreateUpdate) => {
    try {
      await dispatch(createExpense(data)).unwrap();
      // Redirect to expenses list on success
      router.push('/expenses');
    } catch (error) {
      // Error is handled by the reducer
      console.error('Failed to create expense:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/expenses');
  };

  // Show loading spinner while required data is loading
  const isInitialLoading = categoriesLoading || departmentsLoading || vendorsLoading || termsLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create New Expense</h1>
            <p className="text-blue-100 text-lg">
              Add a new expense to track school expenditures and maintain financial records
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Current Term: {getCurrentTerm()?.name || 'Not Set'}</span>
            </div>
          </div>
          <Link
            href="/expenses"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Expenses
          </Link>
        </div>
      </div>

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
                  You need to create at least one expense category before you can add expenses.
                </p>
                <Link 
                  href="/categories" 
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300"
                >
                  Create Categories
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
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Expense Details
            </h3>
          </div>
          <div className="p-6">
            <ExpenseForm
              categories={categories}
              departments={departments}
              vendors={vendors}
              terms={terms}
              initialTerm={getDefaultTerm()}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              error={error || undefined}
              fieldErrors={fieldErrors}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/categories"
              className="group p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Manage Categories</h4>
                <p className="text-xs text-gray-600">Add or edit expense categories</p>
              </div>
            </Link>

            <Link
              href="/departments"
              className="group p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Manage Departments</h4>
                <p className="text-xs text-gray-600">Add or edit departments</p>
              </div>
            </Link>

            <Link
              href="/vendors"
              className="group p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Manage Vendors</h4>
                <p className="text-xs text-gray-600">Add or edit vendors</p>
              </div>
            </Link>

            <Link
              href="/terms"
              className="group p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Manage Terms</h4>
                <p className="text-xs text-gray-600">Add or edit academic terms</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 