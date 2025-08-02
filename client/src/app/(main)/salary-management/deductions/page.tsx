'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, LoadingSpinner } from '@/components/ui';
import { Plus, Search, Edit, Trash2, Eye, TrendingDown, Shield, Heart, Clock, AlertTriangle, Settings, RefreshCw, Activity, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { getSalaryDeductions, deleteSalaryDeduction } from '@/lib/api';
import { SalaryDeduction } from '@/types';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui';

export default function SalaryDeductionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [deductions, setDeductions] = useState<SalaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDeduction, setDeletingDeduction] = useState<SalaryDeduction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDeductions();
  }, [isAuthenticated, router]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      const data = await getSalaryDeductions();
      setDeductions(data);
    } catch (error) {
      console.error('Error loading deductions:', error);
      toast.error('Failed to load salary deductions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDeduction) return;

    try {
      setDeleting(true);
      await deleteSalaryDeduction(deletingDeduction.id);
      toast.success('Salary deduction deleted successfully');
      setDeductions(prev => prev.filter(d => d.id !== deletingDeduction.id));
      setShowDeleteModal(false);
      setDeletingDeduction(null);
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast.error('Failed to delete salary deduction');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDeductionIcon = (type: string) => {
    switch (type) {
      case 'tax':
        return <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
      case 'insurance':
        return <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
      case 'medical':
        return <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      case 'loan':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />;
      case 'advance':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
      default:
        return <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />;
    }
  };

  const getDeductionColor = (type: string) => {
    switch (type) {
      case 'tax':
        return 'bg-red-100 text-red-800';
      case 'insurance':
        return 'bg-blue-100 text-blue-800';
      case 'medical':
        return 'bg-green-100 text-green-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      case 'advance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = deduction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || deduction.deduction_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && deduction.is_active) ||
                         (filterStatus === 'inactive' && !deduction.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRefresh = () => {
    loadDeductions();
  };

  const handleSearch = () => {
    // Search is handled by the filter function
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <TrendingDown className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Salary Deductions</h1>
            <p className="text-red-100 text-lg">
              Manage salary deductions for staff members with comprehensive oversight
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-red-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Deductions: {deductions.length}</span>
            </div>
            <div className="w-1 h-1 bg-red-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Active: {deductions.filter(d => d.is_active).length}</span>
            </div>
          </div>
          <Link
            href="/salary-management/deductions/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Deduction
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900">{deductions.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">{deductions.filter(d => d.is_active).length}</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{deductions.filter(d => !d.is_active).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Types</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(deductions.map(d => d.deduction_type)).size}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-red-600" />
              Search Deductions
            </h3>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search deductions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all duration-300"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all duration-300">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white transition-all duration-300">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">
              Showing {filteredDeductions.length} of {deductions.length} deductions
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-600">Loading deductions...</span>
          </div>
        </div>
      )}

      {/* Deductions List */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          {filteredDeductions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No deductions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first salary deduction.'
                }
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <Link href="/salary-management/deductions/create">
                  <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Deduction
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDeductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-xl">
                        {getDeductionIcon(deduction.deduction_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{deduction.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${getDeductionColor(deduction.deduction_type)}`}>
                            {deduction.deduction_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={`${deduction.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {deduction.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {deduction.description && (
                          <p className="text-sm text-gray-600 mt-2">{deduction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {deduction.is_percentage ? `${deduction.amount}%` : formatCurrency(deduction.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deduction.is_percentage ? 'of base salary' : 'per month'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/salary-management/deductions/${deduction.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/salary-management/deductions/${deduction.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingDeduction(deduction);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDeduction(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Deduction"
        message={`Are you sure you want to delete "${deletingDeduction?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
} 