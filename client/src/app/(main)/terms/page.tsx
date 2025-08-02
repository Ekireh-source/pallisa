'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  fetchTerms, 
  deleteTerm, 
  clearError 
} from '@/store/slices/termSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Activity, 
  FileText, 
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';



export default function TermsPage() {
  const dispatch = useAppDispatch();
  
  // Redux state with defensive checks
  const termState = useAppSelector(state => state.terms);
  
  // Destructure with fallback values
  const { terms = [], loading = false, error = null } = termState || {};
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: '',
    status: '',
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchTerms());
  }, [dispatch]);

  // Get current term
  const currentTerm = terms.find(term => term.is_current);

  // Get unique academic years
  const academicYears = [...new Set(terms.map(term => term.academic_year_name).filter(Boolean))];

  // Filter terms
  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.academic_year_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !filters.academicYear || term.academic_year_name === filters.academicYear;
    
    const matchesStatus = !filters.status || 
      (filters.status === 'current' && term.is_current) ||
      (filters.status === 'active' && term.is_active) ||
      (filters.status === 'inactive' && !term.is_active);

    return matchesSearch && matchesYear && matchesStatus;
  });

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
      await dispatch(deleteTerm(id));
      dispatch(fetchTerms()); // Refresh the list
    }
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
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
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Academic Terms</h1>
            <p className="text-blue-100 text-lg">
              Manage academic terms for expense organization and reporting
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Terms: {terms.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Expenses: {terms.reduce((sum, term) => sum + term.expense_count, 0)}</span>
            </div>
          </div>
          <Link
            href="/terms/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Term
          </Link>
        </div>
      </div>

      {/* Current Term Highlight */}
      {currentTerm && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Current Active Term
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-green-900">{currentTerm.name}</h4>
                  <p className="text-green-700">{currentTerm.academic_year_name}</p>
                  <p className="text-sm text-green-600">
                    {formatDate(currentTerm.start_date)} - {formatDate(currentTerm.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 rounded-full">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Active</span>
                </div>
                <Link
                  href={`/terms/${currentTerm.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border-2 border-green-300 text-green-700 bg-white rounded-xl font-semibold hover:bg-green-50 transition-all duration-300"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            Search Terms
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search terms by name or academic year..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                  <select
                    value={filters.academicYear}
                    onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="">All Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="">All Status</option>
                    <option value="current">Current</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Terms
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms Grid */}
      {filteredTerms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              No Terms Found
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No terms found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating a new academic term.'}
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <Link
                href="/terms/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Term
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerms.map((term) => (
            <div key={term.id} className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {term.name}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    {term.is_current && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-800">Current</span>
                      </div>
                    )}
                    <Link
                      href={`/terms/${term.id}/edit`}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit term"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(term.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete term"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium">{term.academic_year_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(term.start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{formatDate(term.end_date)}</span>
                  </div>
                  {term.duration_days && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{term.duration_days} days</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      {term.expense_count} expenses
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(term.created_at)}</span>
                  </div>
                </div>

                {!term.is_active && (
                  <div className="mt-3 flex items-center space-x-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-yellow-700 font-medium">Inactive</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {terms.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Term Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Terms</p>
                    <p className="text-2xl font-bold text-blue-900">{terms.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-green-900">
                      {terms.reduce((sum, term) => sum + term.expense_count, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Active Terms</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {terms.filter(term => term.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 