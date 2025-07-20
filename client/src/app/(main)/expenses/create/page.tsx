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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
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
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Create New Expense</h1>
            <p className="mt-2 text-gray-600">
              Add a new expense to track school expenditures
            </p>
          </div>
        </div>

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
                    You need to create at least one expense category before you can add expenses.{' '}
                    <Link 
                      href="/expenses/categories" 
                      className="font-medium underline text-yellow-700 hover:text-yellow-600"
                    >
                      Create categories here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Expense Form */
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
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/expenses/categories"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-md mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📂</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Manage Categories</h4>
                <p className="text-xs text-gray-500 mt-1">Add or edit expense categories</p>
              </div>
            </Link>

            <Link
              href="/expenses/departments"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-md mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏢</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Manage Departments</h4>
                <p className="text-xs text-gray-500 mt-1">Add or edit departments</p>
              </div>
            </Link>

            <Link
              href="/expenses/vendors"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500 rounded-md mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏪</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Manage Vendors</h4>
                <p className="text-xs text-gray-500 mt-1">Add or edit vendors</p>
              </div>
            </Link>

            <Link
              href="/expenses/terms"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-md mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📅</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900">Manage Terms</h4>
                <p className="text-xs text-gray-500 mt-1">Add or edit academic terms</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 