'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { 
  CreditCard, 
  Activity, 
  Calendar, 
  Plus, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  X, 
  Search, 
  Filter, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

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

  // Helper function to get the current term
  const getCurrentTerm = useCallback(() => {
    return terms.find(term => term.is_current) || null;
  }, [terms]);

  // Helper function to get the most recent term if no current term
  const getMostRecentTerm = useCallback(() => {
    if (terms.length === 0) return null;
    
    // Sort terms by start date (most recent first)
    const sortedTerms = [...terms].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    return sortedTerms[0];
  }, [terms]);

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
  }, [terms, selectedTerm, getCurrentTerm, getMostRecentTerm]);

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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Expense Management</h1>
            <p className="text-blue-100 text-lg">
              Track, manage, and analyze school expenses with comprehensive oversight
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Records: {totalCount}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Current Term: {getCurrentTerm()?.name || 'Not Set'}</span>
            </div>
          </div>
          <Link
            href="/expenses/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Expense
          </Link>
        </div>
      </div>

      {/* Term Selection */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Academic Term Filter
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-semibold text-gray-700">Academic Term:</label>
              <select
                value={selectedTerm || ''}
                onChange={(e) => handleTermChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto bg-white hover:border-gray-300 transition-colors"
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
            </div>
            {selectedTerm && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700 font-medium">
                  {getCurrentTerm()?.id === selectedTerm 
                    ? "Showing expenses for current term" 
                    : "Showing expenses for selected term only"
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {selectedTerm ? 'Term Expenses' : 'Total Expenses'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.total_expenses || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Approved Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.approved_expenses || 0)}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.pending_expenses || 0)}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Rejected Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency((summary.total_expenses || 0) - (summary.approved_expenses || 0) - (summary.pending_expenses || 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <X className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filters
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses by title, description, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={localFilters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <select
                    value={localFilters.department || ''}
                    onChange={(e) => handleFilterChange('department', e.target.value || undefined)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">All Departments</option>
                    {departments.map(department => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={localFilters.approved === undefined ? '' : localFilters.approved.toString()}
                    onChange={(e) => handleFilterChange('approved', e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localFilters.start_date || ''}
                      onChange={(e) => handleFilterChange('start_date', e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={localFilters.end_date || ''}
                      onChange={(e) => handleFilterChange('end_date', e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} expenses
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-600">Loading expenses...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Expenses</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {!loading && !error && expenses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <ExpenseTable
            expenses={expenses}
            onApprove={handleApprove}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && expenses.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-600 mb-6">No expenses match your current filters.</p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Clear Filters
            </button>
            <Link
              href="/expenses/create"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Add First Expense
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
} 