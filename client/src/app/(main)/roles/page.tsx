'use client';

import React, { useEffect, useState } from 'react';
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Shield, Users, Filter, Calendar, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { Role } from '@/types';
import { useHasPermission, RequirePermission, PERMISSIONS } from '@/lib/permissions';

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { roles, loading, error } = useAppSelector((state) => state.role);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [superAdminFilter, setSuperAdminFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  // Check permissions
  const canViewRoles = useHasPermission(PERMISSIONS.ADMIN.MANAGE_ROLES);
  const canCreateRoles = useHasPermission(PERMISSIONS.ADMIN.MANAGE_ROLES);
  const canEditRoles = useHasPermission(PERMISSIONS.ADMIN.MANAGE_ROLES);
  const canDeleteRoles = useHasPermission(PERMISSIONS.ADMIN.MANAGE_ROLES);

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

  const handleSearch = () => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (superAdminFilter && superAdminFilter !== 'all') filters.is_superadmin = superAdminFilter === 'true';
    dispatch(fetchRoles(filters));
  };

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  You don't have permission to access the Roles Management page.
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Role Management
            </h1>
            <p className="text-gray-600 mt-2">Manage system roles and permissions</p>
          </div>
          <RequirePermission permission={PERMISSIONS.ADMIN.MANAGE_ROLES}>
            <Link href="/roles/create">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-5 h-5 mr-2" />
                Create Role
              </Button>
            </Link>
          </RequirePermission>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by role name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
              <Select value={superAdminFilter} onValueChange={setSuperAdminFilter}>
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
                onClick={handleSearch}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                                <div className="text-sm text-gray-500">ID: {role.id}</div>
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
                            <RequirePermission permission={PERMISSIONS.ADMIN.MANAGE_ROLES}>
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
                                  <RequirePermission permission={PERMISSIONS.ADMIN.MANAGE_ROLES}>
                                    <DropdownMenuItem 
                                      onClick={() => router.push(`/roles/${role.id}/edit`)}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer"
                                    >
                                      <Edit className="mr-3 h-4 w-4" />
                                      Edit Role
                                    </DropdownMenuItem>
                                  </RequirePermission>
                                  <RequirePermission permission={PERMISSIONS.ADMIN.MANAGE_ROLES}>
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
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new role.</p>
                    <div className="mt-6">
                      <RequirePermission permission={PERMISSIONS.ADMIN.MANAGE_ROLES}>
                        <Link href="/roles/create">
                          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Role
                          </Button>
                        </Link>
                      </RequirePermission>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border-0">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">Delete Role</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this role? This will permanently remove the role and may affect users assigned to it.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 