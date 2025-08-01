'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { 
  Plus, 
  Edit, 
  Eye, 
  Home,
  Car,
  Heart,
  Award,
  Clock,
  Gift,
  Settings,
  Trash2,
  Activity,
  FileText,
  RefreshCw,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { getSalaryAllowances, deleteSalaryAllowance } from '@/lib/api';
import { SalaryAllowance } from '@/types';
import { toast } from 'sonner';

export default function SalaryAllowancesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAllowance, setDeletingAllowance] = useState<SalaryAllowance | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchAllowances = async () => {
      try {
        setLoading(true);
        const data = await getSalaryAllowances();
        setAllowances(data);
      } catch (error) {
        console.error('Error fetching allowances:', error);
        toast.error('Failed to fetch salary allowances');
      } finally {
        setLoading(false);
      }
    };

    fetchAllowances();
  }, [isAuthenticated, router]);

  const handleDelete = async () => {
    if (!deletingAllowance) return;

    try {
      setDeleting(true);
      await deleteSalaryAllowance(deletingAllowance.id);
      toast.success('Salary allowance deleted successfully');
      setAllowances(prev => prev.filter(a => a.id !== deletingAllowance.id));
      setShowDeleteModal(false);
      setDeletingAllowance(null);
    } catch (error) {
      console.error('Error deleting allowance:', error);
      toast.error('Failed to delete salary allowance');
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

  const getAllowanceIcon = (type: string) => {
    switch (type) {
      case 'housing':
        return <Home className="h-4 w-4 text-blue-600" />;
      case 'transport':
        return <Car className="h-4 w-4 text-green-600" />;
      case 'medical':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'responsibility':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'overtime':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-pink-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAllowanceColor = (type: string) => {
    switch (type) {
      case 'housing':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'responsibility':
        return 'bg-purple-100 text-purple-800';
      case 'overtime':
        return 'bg-orange-100 text-orange-800';
      case 'bonus':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAllowances = allowances.filter(allowance =>
    allowance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allowance.allowance_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearAllFilters = () => {
    setSearchTerm('');
    setShowFilters(false);
  };

  // Calculate statistics
  const totalAllowances = allowances.length;
  const activeAllowances = allowances.filter(a => a.is_active).length;
  const fixedAmountAllowances = allowances.filter(a => !a.is_percentage).length;
  const percentageAllowances = allowances.filter(a => a.is_percentage).length;

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
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Salary Allowances</h1>
            <p className="text-green-100 text-base sm:text-lg">
              Configure and manage salary allowances for staff
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-green-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Total: {totalAllowances}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Active: {activeAllowances}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Fixed: {fixedAmountAllowances}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Button
              onClick={() => {/* TODO: Add bulk upload functionality */}}
              disabled={loading}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Bulk Upload
            </Button>
            <Link
              href="/salary-management/allowances/create"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              New Allowance
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Allowances
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{totalAllowances}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                All Allowances
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Allowances
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{activeAllowances}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Currently Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Fixed Amount
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{fixedAmountAllowances}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Fixed Rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Percentage
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{percentageAllowances}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Percentage Rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span>Search Allowances</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find allowances by name or type
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Refresh allowances */}}
                className="flex items-center space-x-2 text-xs sm:text-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search allowances by name or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <Button onClick={() => {/* TODO: Implement search */}} className="flex items-center space-x-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowance Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Types</option>
                      <option value="housing">Housing</option>
                      <option value="transport">Transport</option>
                      <option value="medical">Medical</option>
                      <option value="responsibility">Responsibility</option>
                      <option value="overtime">Overtime</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Filter
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Allowances</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="flex items-center space-x-2"
                    >
                      <span>Clear All Filters</span>
                    </Button>
                  </div>
                  <Button
                    onClick={() => {/* TODO: Apply filters */}}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allowances Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>Salary Allowances ({filteredAllowances.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            All configured salary allowances for staff
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredAllowances.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? 'No allowances found matching your criteria' 
                  : 'No salary allowances found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first salary allowance'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <span>Clear Search</span>
                  </Button>
                )}
                {!searchTerm && (
                  <Link href="/salary-management/allowances/create" className="w-full sm:w-auto">
                    <Button className="flex items-center space-x-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      <span>Create First Allowance</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allowance
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Type
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Amount
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAllowances.map((allowance) => (
                    <tr key={allowance.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getAllowanceIcon(allowance.allowance_type)}
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {allowance.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {allowance.description || 'No description provided'}
                            </div>
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              Type: {allowance.allowance_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden md:table-cell">
                        <Badge className={getAllowanceColor(allowance.allowance_type)}>
                          {allowance.allowance_type}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm font-semibold text-gray-900">
                          {allowance.is_percentage ? `${allowance.amount}%` : formatCurrency(allowance.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {allowance.is_percentage ? 'of base salary' : 'per month'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${allowance.is_percentage ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                            {allowance.is_percentage ? 'Percentage' : 'Fixed Amount'}
                          </Badge>
                          {allowance.is_active && (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/salary-management/allowances/${allowance.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/salary-management/allowances/${allowance.id}/edit`)}
                            className="flex items-center space-x-1 px-2 py-1 h-8"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingAllowance(allowance);
                              setShowDeleteModal(true);
                            }}
                            className="flex items-center space-x-1 px-2 py-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingAllowance(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Allowance"
        message={`Are you sure you want to delete "${deletingAllowance?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
} 