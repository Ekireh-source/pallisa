'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchRoleById, deleteRole } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Shield, Calendar, AlertTriangle, User, Activity, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';
import type { Permission } from '@/types';

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentRole, loading, error } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const roleId = Number(params.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (roleId) {
      dispatch(fetchRoleById(roleId));
    }
  }, [isAuthenticated, router, dispatch, roleId]);

  const handleDelete = () => {
    if (currentRole && !currentRole.is_superadmin) {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
        try {
          await dispatch(deleteRole(roleId));
          router.push('/roles');
        } catch (error) {
          console.error('Error deleting role:', error);
    }
  };

  const getSuperAdminBadge = (isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Regular Role</Badge>;
  };

  const getPermissionCount = () => {
    return currentRole?.permissions?.length || 0;
  };

  const groupPermissionsByCategory = () => {
    if (!currentRole?.permissions) return {};
    
    const grouped: Record<string, Permission[]> = {};
    currentRole.permissions.forEach(permission => {
      const categoryName = permission.category?.name || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(permission);
    });
    
    return grouped;
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Role</h2>
              <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/roles">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  Back to Roles
                </Button>
          </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentRole) {
    return (
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Role Not Found</h2>
              <p className="text-gray-600 mb-6">The role you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/roles">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  Back to Roles
                </Button>
          </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const groupedPermissions = groupPermissionsByCategory();

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{currentRole.name}</h1>
            <p className="text-indigo-100 text-base sm:text-lg">
              Role Details and Permissions
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-indigo-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Type: {currentRole.is_superadmin ? 'Super Admin' : 'Regular Role'}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>ID: {currentRole.id}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Permissions: {getPermissionCount()}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/roles"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Roles
          </Link>
            <Link
              href={`/roles/${roleId}/edit`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Edit Role
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Role Name
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {currentRole.name}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                Role
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Type
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {currentRole.is_superadmin ? 'Super Admin' : 'Regular'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Badge className={currentRole.is_superadmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>
                {currentRole.is_superadmin ? 'Super Admin' : 'Regular Role'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Permissions
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {getPermissionCount()}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Total Permissions
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Categories
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {Object.keys(groupedPermissions).length}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Permission Categories
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>Role Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Core details about this role
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Role Name</p>
                <p className="text-lg font-semibold text-gray-900">{currentRole.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Role Type</p>
                <div className="mt-1">{getSuperAdminBadge(currentRole.is_superadmin)}</div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
              <p className="text-gray-900">
                {currentRole.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Created</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {currentRole.created_at ? format(new Date(currentRole.created_at), 'MMM dd, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {currentRole.updated_at ? format(new Date(currentRole.updated_at), 'MMM dd, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>Statistics</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Role statistics and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{getPermissionCount()}</div>
              <div className="text-sm text-blue-600">Total Permissions</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(groupedPermissions).length}
              </div>
              <div className="text-sm text-green-600">Permission Categories</div>
            </div>

            {currentRole.is_superadmin && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">∞</div>
                <div className="text-sm text-purple-600">All Permissions</div>
                <p className="text-xs text-purple-500 mt-1">Super admin has access to everything</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>Assigned Permissions</span>
            <Badge className="ml-2">{getPermissionCount()}</Badge>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage role permissions and access rights. Users with this role will have access to the selected permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {currentRole.is_superadmin ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Super Admin Role</h3>
              <p className="text-gray-600">
                This role has access to all permissions in the system.
              </p>
            </div>
          ) : getPermissionCount() === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Permissions Assigned</h3>
              <p className="text-gray-600 text-sm">This role doesn&apos;t have any specific permissions assigned</p>
              <Link href={`/roles/${roleId}/edit`}>
                <Button>Assign Permissions</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([categoryName, permissions]) => (
                <div key={categoryName} className="border border-gray-200 rounded-lg">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{categoryName}</h3>
                    <p className="text-sm text-gray-500">{permissions.length} permissions</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                            {permission.description && (
                              <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common actions for this role
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <Link href={`/roles/${roleId}/edit`}>
              <Button className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Role</span>
              </Button>
            </Link>
            {!currentRole.is_superadmin && (
              <Button 
                variant="outline"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Role</span>
              </Button>
            )}
            <Link href="/roles">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Roles</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Role Deletion"
        message={`Are you sure you want to delete the role "${currentRole?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
} 