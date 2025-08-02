"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  Search, 
  Download, 
  RefreshCw, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  Users,
  XCircle,
} from 'lucide-react';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface StudentFeeBalance {
  id: number;
  student: number;
  student_name: string;
  student_id: string;
  class_name: string;
  academic_year: number;
  academic_year_name: string;
  term: number;
  term_name: string;
  total_expected: string;
  total_paid: string;
  total_discounts: string;
  total_pending: string;
  balance_status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  payment_percentage: string;
  last_calculated: string;
  created_at: string;
  updated_at: string;
}

type SortField = 'student_name' | 'class_name' | 'total_expected' | 'total_paid' | 'total_pending' | 'balance_status' | 'payment_percentage';
type SortOrder = 'asc' | 'desc';

export default function StudentFeeBalancesPage() {
  const [balances, setBalances] = useState<StudentFeeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField] = useState<SortField>('student_name');
  const [sortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<StudentFeeBalance[]>(API_ENDPOINTS.FEES + 'balances/');
      setBalances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to load student fee balances');
    } finally {
      setLoading(false);
    }
  };

 


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-0">Fully Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Partially Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800 border-0">Unpaid</Badge>;
      case 'overpaid':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Overpaid</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">Unknown</Badge>;
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

  const handleRefresh = () => {
    fetchBalances();
  };

  const filteredBalances = balances.filter(balance =>
    balance.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.academic_year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.term_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBalances = [...filteredBalances].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'total_expected' || sortField === 'total_paid' || sortField === 'total_pending') {
      aValue = parseFloat(aValue || '0');
      bValue = parseFloat(bValue || '0');
    } else if (sortField === 'payment_percentage') {
      aValue = parseFloat(aValue || '0');
      bValue = parseFloat(bValue || '0');
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalExpected = balances.reduce((sum, balance) => sum + parseFloat(balance.total_expected || '0'), 0);
  const totalPaid = balances.reduce((sum, balance) => sum + parseFloat(balance.total_paid || '0'), 0);
  const totalPending = balances.reduce((sum, balance) => sum + parseFloat(balance.total_pending || '0'), 0);
  const fullyPaidCount = balances.filter(b => b.balance_status === 'paid').length;
  const unpaidCount = balances.filter(b => b.balance_status === 'unpaid').length;

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
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Student Fee Balances</h1>
            <p className="text-blue-100 text-lg">
              Track and manage student fee balances across all classes and terms
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Students: {balances.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Expected: {formatCurrency(totalExpected.toString())}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Collected: {formatCurrency(totalPaid.toString())}</span>
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

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            Search Student Balances
          </h3>
        </div>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, class, year, or term..."
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
              Error Loading Student Balances
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

      {/* Balances Grid */}
      {sortedBalances.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              No Student Balances Found
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No student balances found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Student fee balances will appear here once they are calculated.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBalances.map((balance) => (
            <div key={balance.id} className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {balance.student_name}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {balance.student_id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {getStatusBadge(balance.balance_status)}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium">{balance.class_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium">{balance.academic_year_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium">{balance.term_name}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expected:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(balance.total_expected)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(balance.total_paid)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(balance.total_pending)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment %:</span>
                    <span className="font-semibold text-blue-600">{formatPercentage(balance.payment_percentage)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      {new Date(balance.last_calculated).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    <span>Balance</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {balances.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Fee Balance Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Students</p>
                    <p className="text-2xl font-bold text-blue-900">{balances.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Fully Paid</p>
                    <p className="text-2xl font-bold text-green-900">{fullyPaidCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Unpaid</p>
                    <p className="text-2xl font-bold text-red-900">{unpaidCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Pending</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(totalPending.toString())}
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