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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Term {
  id: number;
  name: string;
  academic_year: number;
  academic_year_name?: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expense_count: number;
  duration_days: number | null;
}

export default function TermsPage() {
  const dispatch = useAppDispatch();
  
  // Redux state with defensive checks
  const termState = useAppSelector(state => state.terms);
  
  // Destructure with fallback values
  const { terms = [], loading = false, error = null } = termState || {};
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    academicYear: '',
    status: '',
    dateRange: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'academic_year' | 'start_date' | 'expense_count'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchTerms());
  }, [dispatch]);

  // Get current term
  const currentTerm = terms.find(term => term.is_current);

  // Filter and sort terms
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

  // Sort terms
  const sortedTerms = [...filteredTerms].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'academic_year':
        aValue = a.academic_year_name;
        bValue = b.academic_year_name;
        break;
      case 'start_date':
        aValue = new Date(a.start_date);
        bValue = new Date(b.start_date);
        break;
      case 'expense_count':
        aValue = a.expense_count;
        bValue = b.expense_count;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Group terms by academic year
  const groupedTerms = sortedTerms.reduce((groups, term) => {
    const year = term.academic_year_name || 'Unknown';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(term);
    return groups;
  }, {} as Record<string, Term[]>);

  // Pagination
  const totalPages = Math.ceil(sortedTerms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTerms = sortedTerms.slice(startIndex, endIndex);

  // Get unique academic years for filter
  const academicYears = [...new Set(terms.map(term => term.academic_year_name).filter(Boolean))].sort().reverse();

  // Handle delete
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
      await dispatch(deleteTerm(id));
      dispatch(fetchTerms()); // Refresh the list
    }
  };

  // Handle sort
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Toggle year expansion
  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (term: Term) => {
    if (term.is_current) {
      return <Badge className="bg-green-100 text-green-800 border-0">Current</Badge>;
    }
    if (term.is_active) {
      return <Badge className="bg-blue-100 text-blue-800 border-0">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-0">Inactive</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Academic Terms</h1>
              <p className="mt-2 text-gray-600">
                Manage academic terms for expense organization and reporting
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md ${
                    viewMode === 'table' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
            >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
              <Link href="/terms/create">
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Term</span>
                </Button>
            </Link>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-50 border border-red-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Term Highlight */}
        {currentTerm && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Current Active Term</h3>
                    <p className="text-green-700">
                      {currentTerm.name} ({currentTerm.academic_year_name})
                    </p>
                    <p className="text-sm text-green-600">
                      {formatDate(currentTerm.start_date)} - {formatDate(currentTerm.end_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>
                  <Link href={`/terms/${currentTerm.id}/edit`}>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border border-gray-100 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
            <div className="flex-1">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search terms by name or academic year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select
                    value={filters.academicYear}
                    onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
          </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="current">Current</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
        </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Dates</option>
                    <option value="current">Current Year</option>
                    <option value="previous">Previous Year</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms Display */}
        {sortedTerms.length === 0 ? (
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No terms found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating a new academic term.'}
              </p>
              {!searchTerm && !Object.values(filters).some(f => f) && (
                <Link href="/terms/create">
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Term</span>
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <div className="space-y-6">
            {Object.entries(groupedTerms).map(([year, yearTerms]) => (
              <Card key={year} className="bg-white shadow-sm border border-gray-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleYear(year)}
                        className="p-1"
                      >
                        {expandedYears.has(year) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {year} ({yearTerms.length} terms)
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {yearTerms.filter(t => t.is_current).length} current
                    </Badge>
                  </div>
                </CardHeader>
                {expandedYears.has(year) && (
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              <button
                                onClick={() => handleSort('name')}
                                className="flex items-center space-x-1 hover:text-gray-900"
                              >
                                <span>Term Name</span>
                                {sortBy === 'name' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              <button
                                onClick={() => handleSort('start_date')}
                                className="flex items-center space-x-1 hover:text-gray-900"
                              >
                                <span>Duration</span>
                                {sortBy === 'start_date' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">
                              <button
                                onClick={() => handleSort('expense_count')}
                                className="flex items-center space-x-1 hover:text-gray-900"
                              >
                                <span>Expenses</span>
                                {sortBy === 'expense_count' && (
                                  sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearTerms.map((term) => (
                            <tr key={term.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="font-medium text-gray-900">{term.name}</div>
                                  {term.is_current && (
                                    <Badge className="bg-green-100 text-green-800 border-0 text-xs">Current</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {getStatusBadge(term)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm text-gray-600">
                                  <div>{formatDate(term.start_date)} - {formatDate(term.end_date)}</div>
                                  {term.duration_days && (
                                    <div className="text-xs text-gray-500">{term.duration_days} days</div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{term.expense_count}</span>
                                  <span className="text-sm text-gray-500">expenses</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Link href={`/terms/${term.id}/edit`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <button
                                    onClick={() => handleDelete(term.id)}
                                    className="text-red-600 hover:text-red-900 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedTerms.map((term) => (
              <Card 
                key={term.id} 
                className={`overflow-hidden shadow-sm border transition-all duration-200 ${
                  term.is_current 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-white hover:shadow-md border-gray-100'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-lg font-medium truncate ${
                        term.is_current ? 'text-green-900' : 'text-gray-900'
                      }`}>
                      {term.name}
                    </h3>
                      {term.is_current && (
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/terms/${term.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Academic Year:</span>
                      <span className="font-medium">{term.academic_year_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {formatDate(term.start_date)} - {formatDate(term.end_date)}
                      </span>
                    </div>
                    {term.duration_days && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Days:</span>
                        <span className="font-medium">{term.duration_days} days</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <div>{getStatusBadge(term)}</div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expenses:</span>
                      <span className="font-medium">{term.expense_count}</span>
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination for Grid View */}
        {viewMode === 'grid' && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedTerms.length)} of {sortedTerms.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {terms.length > 0 && (
          <Card className="mt-8 bg-white shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Total Terms</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{terms.length}</div>
              </div>
                <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500 truncate">Current Terms</div>
                  <div className="mt-1 text-3xl font-semibold text-green-600">
                    {terms.filter(term => term.is_current).length}
                  </div>
                </div>
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Total Expenses</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {terms.reduce((sum, term) => sum + term.expense_count, 0)}
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Avg Expenses/Term</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {terms.length > 0 ? Math.round(terms.reduce((sum, term) => sum + term.expense_count, 0) / terms.length) : 0}
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 