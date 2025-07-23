"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  Search, 
  Download, 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle
} from 'lucide-react';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface Term {
  id: number;
  name: string;
  is_current: boolean;
  academic_year: number;
  academic_year_name: string;
}

interface TermFeeCollectionSummary {
  id: number;
  academic_year: number;
  academic_year_name: string;
  term: number;
  term_name: string;
  total_expected_from_structures: string;
  total_expected_with_overrides: string;
  total_collected: string;
  total_discounts_given: string;
  total_pending_collection: string;
  total_students: number;
  students_with_fees: number;
  fully_paid_students: number;
  partially_paid_students: number;
  unpaid_students: number;
  overpaid_students: number;
  collection_rate: string;
  collection_percentage: string;
  average_payment_per_student: string;
  is_collection_complete: boolean;
  outstanding_amount: string;
  collection_efficiency: string;
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'academic_year_name' | 'term_name' | 'total_expected_with_overrides' | 'total_collected' | 'total_pending_collection' | 'collection_rate' | 'students_with_fees';
type SortOrder = 'asc' | 'desc';

export default function FeeCollectionSummariesPage() {
  const [summaries, setSummaries] = useState<TermFeeCollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('academic_year_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);

  useEffect(() => {
    fetchSummaries();
    fetchCurrentTerm();
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<{ results: TermFeeCollectionSummary[] }>(API_ENDPOINTS.FEES + 'collection-summaries/');
      setSummaries(data.results || []);
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError('Failed to load fee collection summaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTerm = async () => {
    try {
      const data = await apiGet<{ results: Term[] }>(API_ENDPOINTS.EXPENSES + 'terms/');
      const current = data.results ? data.results.find(term => term.is_current) || null : null;
      setCurrentTerm(current);
    } catch (err) {
      console.error('Error fetching current term:', err);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-gray-600" /> : 
      <ArrowDown className="h-4 w-4 text-gray-600" />;
  };

  const getEfficiencyBadge = (efficiency: string) => {
    switch (efficiency.toLowerCase()) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-0">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Good</Badge>;
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Fair</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800 border-0">Poor</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">{efficiency}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return 'UGX 0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  const formatPercentage = (percentage: string) => {
    if (!percentage) return '0%';
    return `${parseFloat(percentage).toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    fetchSummaries();
  };

  // Filter summaries based on search term
  const filteredSummaries = summaries.filter(summary =>
    summary.academic_year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.term_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.collection_efficiency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort summaries
  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'academic_year_name':
        aValue = a.academic_year_name || '';
        bValue = b.academic_year_name || '';
        break;
      case 'term_name':
        aValue = a.term_name || '';
        bValue = b.term_name || '';
        break;
      case 'total_expected_with_overrides':
        aValue = parseFloat(a.total_expected_with_overrides) || 0;
        bValue = parseFloat(b.total_expected_with_overrides) || 0;
        break;
      case 'total_collected':
        aValue = parseFloat(a.total_collected) || 0;
        bValue = parseFloat(b.total_collected) || 0;
        break;
      case 'total_pending_collection':
        aValue = parseFloat(a.total_pending_collection) || 0;
        bValue = parseFloat(b.total_pending_collection) || 0;
        break;
      case 'collection_rate':
        aValue = parseFloat(a.collection_rate) || 0;
        bValue = parseFloat(b.collection_rate) || 0;
        break;
      case 'students_with_fees':
        aValue = a.students_with_fees || 0;
        bValue = b.students_with_fees || 0;
        break;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Calculate overall statistics
  const stats = {
    totalTerms: summaries.length,
    totalExpected: summaries.reduce((sum, s) => sum + parseFloat(s.total_expected_with_overrides || '0'), 0),
    totalCollected: summaries.reduce((sum, s) => sum + parseFloat(s.total_collected || '0'), 0),
    totalPending: summaries.reduce((sum, s) => sum + parseFloat(s.total_pending_collection || '0'), 0),
    totalStudents: summaries.reduce((sum, s) => sum + s.total_students, 0),
    averageCollectionRate: summaries.length > 0 ? 
      summaries.reduce((sum, s) => sum + parseFloat(s.collection_rate || '0'), 0) / summaries.length : 0,
    completedCollections: summaries.filter(s => s.is_collection_complete).length,
  };

  // Get current term summary
  const currentTermSummary = currentTerm ? summaries.find(summary => 
    Number(summary.term) === Number(currentTerm.id) && Number(summary.academic_year) === Number(currentTerm.academic_year)
  ) : null;

  // Calculate current term statistics
  const currentTermStats = currentTermSummary ? {
    totalExpected: parseFloat(currentTermSummary.total_expected_with_overrides || '0'),
    totalCollected: parseFloat(currentTermSummary.total_collected || '0'),
    totalPending: parseFloat(currentTermSummary.total_pending_collection || '0'),
    totalStudents: currentTermSummary.total_students,
    collectionRate: parseFloat(currentTermSummary.collection_rate || '0'),
    collectionEfficiency: currentTermSummary.collection_efficiency,
    termName: currentTermSummary.term_name,
    academicYearName: currentTermSummary.academic_year_name,
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Collection Summaries</h1>
              <p className="text-gray-600 mt-1">Track overall fee collection performance across all terms</p>
              {currentTermStats && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Current Term Focus
                  </span>
                  <span className="text-sm text-gray-600">
                    Statistics above show data for {currentTermStats.termName} ({currentTermStats.academicYearName})
                  </span>
                </div>
              )}
              {!currentTermStats && currentTerm === null && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    No Current Term Set
                  </span>
                  <span className="text-sm text-gray-600">
                    Statistics above show overall data across all terms
                  </span>
                </div>
              )}
              {!currentTermStats && currentTerm !== null && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    No Data for Current Term
                  </span>
                  <span className="text-sm text-gray-600">
                    No collection summary found for current term. Statistics show overall data.
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Current Term' : 'Total Terms'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentTermStats ? currentTermStats.termName : stats.totalTerms}
                  </p>
                  {currentTermStats && (
                    <p className="text-xs text-gray-500">{currentTermStats.academicYearName}</p>
                  )}
                </div>
                {/* BarChart3 className="h-8 w-8 text-blue-600" /> */}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Expected (Current)' : 'Total Expected'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentTermStats ? currentTermStats.totalExpected.toString() : stats.totalExpected.toString())}
                  </p>
                </div>
                {/* Target className="h-8 w-8 text-gray-600" /> */}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Collected (Current)' : 'Total Collected'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(currentTermStats ? currentTermStats.totalCollected.toString() : stats.totalCollected.toString())}
                  </p>
                </div>
                {/* CheckCircle className="h-8 w-8 text-green-600" /> */}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Pending (Current)' : 'Total Pending'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(currentTermStats ? currentTermStats.totalPending.toString() : stats.totalPending.toString())}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Students (Current)' : 'Total Students'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentTermStats ? currentTermStats.totalStudents : stats.totalStudents}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Collection Rate (Current)' : 'Avg Collection Rate'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentTermStats ? `${currentTermStats.collectionRate.toFixed(1)}%` : `${stats.averageCollectionRate.toFixed(1)}%`}
                  </p>
                  {currentTermStats && (
                    <p className="text-xs text-gray-500">{currentTermStats.collectionEfficiency}</p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {currentTermStats ? 'Status (Current)' : 'Completed Collections'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {currentTermStats ? 
                      (currentTermStats.collectionRate >= 100 ? 'Complete' : 'In Progress') : 
                      stats.completedCollections
                    }
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border border-gray-100 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by academic year, term, or efficiency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Summaries Table */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Fee Collection Summaries ({filteredSummaries.length})
            </CardTitle>
            <CardDescription>
              {searchTerm ? 'Filtered collection summaries' : 'All term fee collection summaries'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Loading summaries...</span>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No summaries found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No fee collection summaries available.'}
                </p>
              </div>
            ) : (
              <div className="w-full">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-2">
                        <button
                          onClick={() => handleSort('academic_year_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Academic Year</span>
                          {getSortIcon('academic_year_name')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('term_name')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Term</span>
                          {getSortIcon('term_name')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('students_with_fees')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Students</span>
                          {getSortIcon('students_with_fees')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_expected_with_overrides')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Expected</span>
                          {getSortIcon('total_expected_with_overrides')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_collected')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Collected</span>
                          {getSortIcon('total_collected')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('total_pending_collection')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Pending</span>
                          {getSortIcon('total_pending_collection')}
                        </button>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleSort('collection_rate')}
                          className="flex items-center space-x-1 hover:text-gray-900"
                        >
                          <span>Rate</span>
                          {getSortIcon('collection_rate')}
                        </button>
                      </div>
                      <div className="col-span-1">Efficiency</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-2">Last Updated</div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {sortedSummaries.map((summary) => (
                      <div key={summary.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50">
                        <div className="col-span-2 text-sm font-medium text-gray-900">
                          {summary.academic_year_name}
                        </div>
                        <div className="col-span-1 text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <span>{summary.term_name}</span>
                            {/* Add current term indicator here if we have that data */}
                          </div>
                        </div>
                        <div className="col-span-1 text-sm text-gray-900">{summary.students_with_fees}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(summary.total_expected_with_overrides)}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(summary.total_collected)}</div>
                        <div className="col-span-1 text-sm text-gray-900">{formatCurrency(summary.total_pending_collection)}</div>
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, parseFloat(summary.collection_rate || '0'))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{formatPercentage(summary.collection_rate)}</span>
                          </div>
                        </div>
                        <div className="col-span-1">{getEfficiencyBadge(summary.collection_efficiency)}</div>
                        <div className="col-span-1">
                          {summary.is_collection_complete ? 
                            <Badge className="bg-green-100 text-green-800 border-0">Complete</Badge> :
                            <Badge className="bg-yellow-100 text-yellow-800 border-0">In Progress</Badge>
                          }
                        </div>
                        <div className="col-span-2 text-xs text-gray-500">{formatDate(summary.last_calculated)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 