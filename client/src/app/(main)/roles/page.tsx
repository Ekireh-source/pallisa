'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRoles, deleteRole } from '@/store/slices/roleSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/Select';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Shield, Users, Filter, Calendar, Lock, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { Role } from '@/types';
import { useHasPermission } from '@/hooks/usePermissions';
import { RequirePermission } from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { roles, loading, error } = useAppSelector((state) => state.role);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [superAdminFilter, setSuperAdminFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check permissions
  const canViewRoles = useHasPermission(PERMISSIONS.MANAGE_ROLES);
  const canDeleteRoles = useHasPermission(PERMISSIONS.MANAGE_ROLES);

  useEffect(() => {
    console.log('RolesPage: useEffect triggered, isAuthenticated:', isAuthenticated, 'user:', user);
    
    if (!isAuthenticated) {
      console.log('RolesPage: User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    // Check if user has permission to view roles
    if (!canViewRoles) {
      console.log('RolesPage: User does not have permission to view roles');
      router.push('/dashboard');
      return;
    }
    
    console.log('RolesPage: User authenticated and has permissions, dispatching fetchRoles');
    dispatch(fetchRoles({}));
  }, [dispatch, isAuthenticated, user, router, canViewRoles]);

  // Debug logging
  useEffect(() => {
    console.log('RolesPage: State updated - roles:', roles, 'loading:', loading, 'error:', error);
  }, [roles, loading, error]);

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string, filterValue: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setIsSearching(true);
      const filters: { search?: string; is_superadmin?: boolean } = {};
      if (searchValue.trim()) filters.search = searchValue.trim();
      if (filterValue && filterValue !== 'all') filters.is_superadmin = filterValue === 'true';
      
      dispatch(fetchRoles(filters)).finally(() => {
        setIsSearching(false);
      });
    }, 500);

    setSearchTimeout(timeout);
  }, [dispatch, searchTimeout]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value, superAdminFilter);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSuperAdminFilter(value);
    debouncedSearch(searchTerm, value);
  };

  // Handle immediate search (for Enter key or search button)
  const handleImmediateSearch = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setIsSearching(true);
    const filters: { search?: string; is_superadmin?: boolean } = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (superAdminFilter && superAdminFilter !== 'all') filters.is_superadmin = superAdminFilter === 'true';
    
    dispatch(fetchRoles(filters)).finally(() => {
      setIsSearching(false);
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSuperAdminFilter('all');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setIsSearching(true);
    dispatch(fetchRoles({})).finally(() => {
      setIsSearching(false);
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() || superAdminFilter !== 'all';

  const handleDelete = (id: number) => {
    if (!canDeleteRoles) {
      console.log('User does not have permission to delete roles');
      return;
    }
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await dispatch(deleteRole(roleToDelete));
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const getPermissionCount = (role: Role) => {
    return role.permissions?.length || 0;
  };

  const getSuperAdminBadge = (isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">Super Admin</Badge>;
    }
    return <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Regular Role</Badge>;
  };

  // If user doesn't have permission to view roles, show access denied
  if (!canViewRoles) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don&apos;t have permission to access the Roles Management page.
              </p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Role Management
          </h1>
          <p className="text-gray-600 mt-2">Manage system roles and permissions</p>
        </div>
        <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
          <Link href="/roles/create">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Create Role
            </Button>
          </Link>
        </RequirePermission>
      </div>

      {/* Enhanced Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                disabled={isSearching}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear Filters</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by role name or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleImmediateSearch()}
                className="pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                disabled={isSearching}
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSearching}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={superAdminFilter} onValueChange={handleFilterChange} disabled={isSearching}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                <SelectValue placeholder="Role Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="true">Super Admin</SelectItem>
                <SelectItem value="false">Regular Roles</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleImmediateSearch}
              disabled={isSearching}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {/* Search Status */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Search className="w-4 h-4" />
                  <span>
                    {searchTerm && `Searching for "${searchTerm}"`}
                    {searchTerm && superAdminFilter !== 'all' && ' and '}
                    {superAdminFilter !== 'all' && `Filtering by ${superAdminFilter === 'true' ? 'Super Admin' : 'Regular'} roles`}
                  </span>
                </div>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {roles.length} result{roles.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {!hasActiveFilters && roles.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3">
                <Search className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Search Tips</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Common searches:</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-50" 
                                onClick={() => handleSearchChange('admin')}>
                            admin
                          </span>
                          <span className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-50" 
                                onClick={() => handleSearchChange('teacher')}>
                            teacher
                          </span>
                          <span className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-50" 
                                onClick={() => handleSearchChange('staff')}>
                            staff
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Quick filters:</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-50" 
                                onClick={() => handleFilterChange('true')}>
                            Super Admin
                          </span>
                          <span className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-gray-50" 
                                onClick={() => handleFilterChange('false')}>
                            Regular Roles
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Roles</p>
                <p className="text-3xl font-bold">{roles.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Super Admin Roles</p>
                <p className="text-3xl font-bold">{roles.filter(r => r.is_superadmin).length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Regular Roles</p>
                <p className="text-3xl font-bold">{roles.filter(r => !r.is_superadmin).length}</p>
              </div>
              <Shield className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Roles ({roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading roles...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg font-medium">{error}</div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roles.map((role, index) => (
                      <tr 
                        key={role.id} 
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                             
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {role.description || 'No description provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getSuperAdminBadge(role.is_superadmin)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                              <Shield className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{getPermissionCount(role)} permissions</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {role.created_at ? format(new Date(role.created_at), 'MMM dd, yyyy') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                                <DropdownMenuItem 
                                  onClick={() => router.push(`/roles/${role.id}`)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                                >
                                  <Eye className="mr-3 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
                                  <DropdownMenuItem 
                                    onClick={() => router.push(`/roles/${role.id}/edit`)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                                  >
                                    <Edit className="mr-3 h-4 w-4" />
                                    Edit Role
                                  </DropdownMenuItem>
                                </RequirePermission>
                                <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(role.id)}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                    disabled={role.is_superadmin}
                                  >
                                    <Trash2 className="mr-3 h-4 w-4" />
                                    Delete Role
                                  </DropdownMenuItem>
                                </RequirePermission>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </RequirePermission>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {roles.length === 0 && !loading && (
                <div className="text-center py-12">
                  {hasActiveFilters ? (
                    <>
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No roles match your current search criteria.
                      </p>
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-400">Try adjusting your search:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {searchTerm && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              Search: &quot;{searchTerm}&quot;
                            </span>
                          )}
                          {superAdminFilter !== 'all' && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              Filter: {superAdminFilter === 'true' ? 'Super Admin' : 'Regular Roles'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 space-x-3">
                        <Button
                          variant="outline"
                          onClick={clearAllFilters}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                        <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
                          <Link href="/roles/create">
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Role
                            </Button>
                          </Link>
                        </RequirePermission>
                      </div>
                    </>
                  ) : (
                    <>
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new role.</p>
                      <div className="mt-6">
                        <RequirePermission permission={PERMISSIONS.MANAGE_ROLES}>
                          <Link href="/roles/create">
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Role
                            </Button>
                          </Link>
                        </RequirePermission>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This will permanently remove the role and may affect users assigned to it."
        confirmText="Delete Role"
        cancelText="Cancel"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
} 