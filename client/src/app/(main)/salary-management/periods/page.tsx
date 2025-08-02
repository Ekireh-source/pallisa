'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Search,
  RefreshCw,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { getSalaryPeriods, deleteSalaryPeriod } from '@/lib/api';
import { SalaryPeriod } from '@/types';
import { toast } from 'sonner';

export default function SalaryPeriodsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [periods, setPeriods] = useState<SalaryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await getSalaryPeriods();
      setPeriods(data);
    } catch (error) {
      console.error('Error fetching salary periods:', error);
      toast.error('Failed to fetch salary periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchPeriods();
  }, [isAuthenticated, router]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this salary period? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteSalaryPeriod(id);
      toast.success('Salary period deleted successfully');
      // Refresh the list
      fetchPeriods();
    } catch (error) {
      console.error('Error deleting salary period:', error);
      toast.error('Failed to delete salary period');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    fetchPeriods();
  };

  const handleSearch = () => {
    // Search is handled by the filter function
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredPeriods = periods.filter(period => {
    return period.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Salary Periods</h1>
            <p className="text-indigo-100 text-lg">
              Manage salary periods for monthly and termly payments with comprehensive oversight
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-indigo-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Periods: {periods.length}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Active: {periods.filter(p => p.is_active).length}</span>
            </div>
          </div>
          <Link
            href="/salary-management/periods/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Period
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Periods</p>
                <p className="text-2xl font-bold text-gray-900">{periods.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Period</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => p.is_active).length}
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
                <p className="text-sm font-medium text-gray-600 mb-1">Closed Periods</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => p.is_closed).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => !p.is_active && !p.is_closed).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
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
              <Search className="w-5 h-5 mr-2 text-indigo-600" />
              Search Periods
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search periods by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border-0 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">
              Showing {filteredPeriods.length} of {periods.length} periods
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 p-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-4 text-gray-600">Loading periods...</span>
          </div>
        </div>
      )}

      {/* Periods List */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          {filteredPeriods.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No periods found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search to see more results.'
                  : 'Get started by creating your first salary period.'
                }
              </p>
              {!searchTerm && (
                <Link href="/salary-management/periods/create">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Period
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPeriods.map((period) => (
                <div key={period.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{period.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(period.start_date)} - {formatDate(period.end_date)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {period.is_active && (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          )}
                          {period.is_closed && (
                            <Badge className="bg-red-100 text-red-800">
                              Closed
                            </Badge>
                          )}
                          {!period.is_active && !period.is_closed && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/salary-management/periods/${period.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {period.can_be_modified && (
                        <Link href={`/salary-management/periods/${period.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      )}
                      {period.can_be_modified && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(period.id)}
                          disabled={deletingId === period.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingId === period.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 