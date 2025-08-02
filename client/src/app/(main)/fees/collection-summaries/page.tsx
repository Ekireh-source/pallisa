"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  Search, 
  Download, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle,
  Activity,
  FileText,
  BarChart3,
  DollarSign,
  Calendar,
  Clock
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
  const [sortField] = useState<SortField>('academic_year_name');
  const [sortOrder] = useState<SortOrder>('desc');
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



  const getEfficiencyBadge = (efficiency: string) => {
    const efficiencyNum = parseFloat(efficiency || '0');
    if (efficiencyNum >= 90) {
      return <Badge className="bg-green-100 text-green-800 border-0">Excellent</Badge>;
    } else if (efficiencyNum >= 75) {
      return <Badge className="bg-blue-100 text-blue-800 border-0">Good</Badge>;
    } else if (efficiencyNum >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Fair</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-0">Poor</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (percentage: string) => {
    const num = parseFloat(percentage || '0');
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = () => {
    fetchSummaries();
  };

  const filteredSummaries = summaries.filter(summary =>
    summary.academic_year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.term_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'total_expected_with_overrides' || sortField === 'total_collected' || sortField === 'total_pending_collection') {
      aValue = parseFloat(aValue || '0');
      bValue = parseFloat(bValue || '0');
    } else if (sortField === 'collection_rate') {
      aValue = parseFloat(aValue || '0');
      bValue = parseFloat(bValue || '0');
    } else if (sortField === 'students_with_fees') {
      aValue = parseInt(aValue || '0');
      bValue = parseInt(bValue || '0');
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalExpected = summaries.reduce((sum, summary) => sum + parseFloat(summary.total_expected_with_overrides || '0'), 0);
  const totalCollected = summaries.reduce((sum, summary) => sum + parseFloat(summary.total_collected || '0'), 0);
  const totalStudents = summaries.reduce((sum, summary) => sum + summary.students_with_fees, 0);
  const fullyPaidStudents = summaries.reduce((sum, summary) => sum + summary.fully_paid_students, 0);

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
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Fee Collection Summaries</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive overview of fee collection performance across all terms
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Terms: {summaries.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Expected: {formatCurrency(totalExpected.toString())}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Collected: {formatCurrency(totalCollected.toString())}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
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
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 rounded-full">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Active</span>
                </div>
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
            Search Collection Summaries
          </h3>
        </div>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by academic year or term name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Collection Summaries
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

      {/* Summaries Grid */}
      {sortedSummaries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
              No Collection Summaries Found
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No collection summaries found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Fee collection summaries will appear here once they are calculated.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSummaries.map((summary) => (
            <div key={summary.id} className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {summary.term_name}
                      </h3>
                      <p className="text-sm text-gray-600">{summary.academic_year_name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {getEfficiencyBadge(summary.collection_efficiency)}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expected:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(summary.total_expected_with_overrides)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Collected:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(summary.total_collected)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(summary.total_pending_collection)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Collection Rate:</span>
                    <span className="font-semibold text-blue-600">{formatPercentage(summary.collection_percentage)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Students with Fees:</span>
                    <span className="font-medium">{summary.students_with_fees}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fully Paid:</span>
                    <span className="font-medium text-green-600">{summary.fully_paid_students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Partially Paid:</span>
                    <span className="font-medium text-yellow-600">{summary.partially_paid_students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Unpaid:</span>
                    <span className="font-medium text-red-600">{summary.unpaid_students}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      {formatDate(summary.last_calculated)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    <span>Collection</span>
                  </div>
                </div>

                {summary.is_collection_complete && (
                  <div className="mt-3 flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Collection Complete</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Collection Summary Statistics
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Terms</p>
                    <p className="text-2xl font-bold text-blue-900">{summaries.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Collected</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(totalCollected.toString())}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Students</p>
                    <p className="text-2xl font-bold text-purple-900">{totalStudents}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Fully Paid Students</p>
                    <p className="text-2xl font-bold text-yellow-900">{fullyPaidStudents}</p>
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