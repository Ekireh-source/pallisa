'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchExpenses, 
  fetchExpenseSummary, 
  approveExpense,
  deleteExpense,
  setFilters,
  clearFilters
} from '@/store/slices/expenseSlice';
import { fetchExpenseCategories } from '@/store/slices/expenseCategorySlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import { fetchTerms } from '@/store/slices/termSlice';
import { restoreAuthFromTokens } from '@/store/slices/authSlice';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ExpenseFilters } from '@/types';

export default function ExpensesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Redux state with defensive checks
  const expenseState = useAppSelector(state => state.expenses);
  const expenseCategoryState = useAppSelector(state => state.expenseCategories);
  const departmentState = useAppSelector(state => state.departments);
  const termState = useAppSelector(state => state.terms);
  const authState = useAppSelector(state => state.auth);

  // Destructure with fallback values
  const { 
    expenses = [], 
    loading = false, 
    error = null, 
    summary = null, 
    filters = {},
    totalCount = 0,
    currentPage = 1,
    pageSize = 10
  } = expenseState || {};
  const { categories = [] } = expenseCategoryState || {};
  const { departments = [] } = departmentState || {};
  const { terms = [], loading: termsLoading = false } = termState || {};
  const { user } = authState || {};

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<number | undefined>(undefined);

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

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchExpenseCategories());
    dispatch(fetchDepartments());
    dispatch(fetchTerms());
  }, [dispatch]);

  // Set default term when terms are loaded
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      // First try to find current term
      const currentTerm = getCurrentTerm();
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
        setLocalFilters(prev => ({ ...prev, term: currentTerm.id }));
      } else {
        // If no current term, use the most recent term
        const mostRecentTerm = getMostRecentTerm();
        if (mostRecentTerm) {
          setSelectedTerm(mostRecentTerm.id);
          setLocalFilters(prev => ({ ...prev, term: mostRecentTerm.id }));
        }
      }
    }
  }, [terms, selectedTerm]);

  // Load expenses and summary when filters change
  useEffect(() => {
    const filtersWithTerm = {
      ...filters,
      term: selectedTerm,
      page: currentPage,
      page_size: pageSize
    };
    dispatch(fetchExpenses(filtersWithTerm));
    dispatch(fetchExpenseSummary({ term: selectedTerm }));
  }, [dispatch, filters, selectedTerm, currentPage, pageSize]);

  // Refresh summary when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedTerm !== undefined) {
        // Refresh summary when user returns to the page
        dispatch(fetchExpenseSummary({ term: selectedTerm }));
      }
    };

    // Listen for visibility change events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh on focus (when user switches back to the tab)
    const handleFocus = () => {
      if (selectedTerm !== undefined) {
        dispatch(fetchExpenseSummary({ term: selectedTerm }));
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch, selectedTerm]);

  // Refresh summary when user navigates back to this page
  useEffect(() => {
    // Refresh summary when component mounts (user navigates to this page)
    if (selectedTerm !== undefined) {
      dispatch(fetchExpenseSummary({ term: selectedTerm }));
    }
  }, [dispatch, selectedTerm]);

  // Auto-refresh summary when it's null (after modifications)
  useEffect(() => {
    if (summary === null && selectedTerm !== undefined) {
      dispatch(fetchExpenseSummary({ term: selectedTerm }));
    }
  }, [dispatch, summary, selectedTerm]);

  // Handle search
  const handleSearch = () => {
    const newFilters = {
      ...localFilters,
      search: searchTerm || undefined,
      term: selectedTerm,
      page: 1, // Reset to first page when searching
      page_size: pageSize
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchExpenses(newFilters));
  };

  // Handle filter change
  const handleFilterChange = (key: keyof ExpenseFilters, value: string | number | boolean | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  // Handle term change
  const handleTermChange = (termId: number | undefined) => {
    setSelectedTerm(termId);
    const newFilters = {
      ...localFilters,
      term: termId,
      page: 1, // Reset to first page when changing term
      page_size: pageSize
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchExpenses(newFilters));
    dispatch(fetchExpenseSummary({ term: termId }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const newFilters = {
      ...filters,
      page,
      page_size: pageSize
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchExpenses(newFilters));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    const newFilters = {
      ...filters,
      page: 1, // Reset to first page when changing page size
      page_size: newPageSize
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchExpenses(newFilters));
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters = {
      ...localFilters,
      search: searchTerm || undefined,
      term: selectedTerm,
      page: 1, // Reset to first page when applying filters
      page_size: pageSize
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchExpenses(newFilters));
    setShowFilters(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalFilters({});
    setSearchTerm('');
    setSelectedTerm(undefined);
    dispatch(clearFilters());
    dispatch(fetchExpenses({ page: 1, page_size: pageSize }));
    dispatch(fetchExpenseSummary({}));
    setShowFilters(false);
  };

  // Handle expense approval
  const handleApprove = async (id: number, approved: boolean) => {
    try {
      // Check authentication status first
      if (!authState?.isAuthenticated) {
        console.error('User not authenticated');
        // You could redirect to login here
        return;
      }

      // Check if user is a school owner
      if (user?.user_type !== 'school_owner') {
        console.error('Only school owners can approve expenses');
        // You could show a toast notification here
        return;
      }

      await dispatch(approveExpense({ id, approved })).unwrap();
      // Refresh summary after approval change
      dispatch(fetchExpenseSummary({ term: selectedTerm }));
    } catch (error) {
      console.error('Failed to approve expense:', error);
      
      // Handle authentication errors specifically
      if (error && typeof error === 'string' && error.includes('token')) {
        // Token is invalid, redirect to login
        router.push('/login');
        return;
      }

      // Handle permission errors
      if (error && typeof error === 'string' && error.includes('school owners')) {
        // Show permission error (you could add a toast notification here)
        console.error('Permission denied: Only school owners can approve expenses');
        return;
      }
      
      // Show error to user (you could add a toast notification here)
    }
  };

  // Handle expense edit
  const handleEdit = (id: number) => {
    router.push(`/expenses/${id}/edit`);
  };

  // Handle expense delete
  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteExpense(id)).unwrap();
      // Refresh summary after deletion
      dispatch(fetchExpenseSummary({ term: selectedTerm }));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  // Handle authentication refresh (for debugging)
  const handleRefreshAuth = async () => {
    try {
      await dispatch(restoreAuthFromTokens()).unwrap();
      console.log('Authentication refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
      router.push('/login');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
              <p className="mt-2 text-gray-600">Manage and track school expenses</p>
              {/* Debug info - remove in production */}
              <p className="mt-1 text-xs text-gray-400">
                Auth: {authState?.isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'} | 
                User: {authState?.user?.email || 'None'}
                <button 
                  onClick={handleRefreshAuth}
                  className="ml-2 text-blue-500 hover:text-blue-700 underline"
                >
                  Refresh Auth
                </button>
              </p>
            </div>
            <Link
              href="/expenses/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Expense
            </Link>
          </div>
        </div>

        {/* Term Selection */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Academic Term:</label>
              <select
                value={selectedTerm || ''}
                onChange={(e) => handleTermChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={termsLoading}
              >
                <option value="">All Terms</option>
                {terms.map(term => {
                  const isCurrentTerm = getCurrentTerm()?.id === term.id;
                  return (
                    <option key={term.id} value={term.id}>
                      {term.name} ({term.academic_year_name || 'Unknown Year'})
                      {isCurrentTerm ? ' - Current' : ''}
                    </option>
                  );
                })}
              </select>
              {selectedTerm && (
                <span className="text-sm text-gray-500">
                  {getCurrentTerm()?.id === selectedTerm 
                    ? "Showing expenses for current term" 
                    : "Showing expenses for selected term only"
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">UGX</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {selectedTerm ? 'Term Expenses' : 'Total Expenses'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(summary.total_expenses)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(summary.approved_expenses)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(summary.pending_expenses)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {selectedTerm ? 'Term Count' : 'Total Count'}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {summary.expense_count.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Filters
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={localFilters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={localFilters.department || ''}
                      onChange={(e) => handleFilterChange('department', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Approval Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={localFilters.approved === undefined ? '' : localFilters.approved.toString()}
                      onChange={(e) => handleFilterChange('approved', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="true">Approved</option>
                      <option value="false">Pending</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={localFilters.start_date || ''}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={localFilters.end_date || ''}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ExpenseTable
            expenses={expenses}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUserId={user?.id}
            userType={user?.user_type}
            loading={loading}
          />
          
          {/* Pagination */}
          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>

        {/* Empty State */}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-6">
                {Object.keys(filters).length > 0 || selectedTerm
                  ? "No expenses match your current filters. Try adjusting your search criteria or selecting a different term."
                  : "Get started by creating your first expense."
                }
              </p>
              <Link
                href="/expenses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add First Expense
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 