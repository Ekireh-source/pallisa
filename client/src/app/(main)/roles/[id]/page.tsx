'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchRoleById, deleteRole } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Shield, Users, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentRole, loading, error } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const roleId = Number(params.id);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (roleId) {
      dispatch(fetchRoleById(roleId));
    }
  }, [isAuthenticated, router, dispatch, roleId]);

  const handleDelete = async () => {
    if (currentRole && !currentRole.is_superadmin) {
      if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
        try {
          await dispatch(deleteRole(roleId));
          router.push('/roles');
        } catch (error) {
          console.error('Error deleting role:', error);
        }
      }
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
    
    const grouped: Record<string, any[]> = {};
    currentRole.permissions.forEach(permission => {
      const categoryName = permission.category?.name || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(permission);
    });
    
    return grouped;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Role</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/roles">
            <Button>Back to Roles</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Role Not Found</h2>
          <p className="text-gray-600 mb-4">The role you're looking for doesn't exist.</p>
          <Link href="/roles">
            <Button>Back to Roles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedPermissions = groupPermissionsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/roles">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Roles</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentRole.name}</h1>
            <p className="text-gray-600 mt-1">Role Details and Permissions</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/roles/${roleId}/edit`}>
            <Button className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Role</span>
            </Button>
          </Link>
          {!currentRole.is_superadmin && (
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Role Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Role Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Role Name</h3>
                <p className="text-lg font-semibold text-gray-900">{currentRole.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Role Type</h3>
                <div className="mt-1">{getSuperAdminBadge(currentRole.is_superadmin)}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900">
                {currentRole.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {currentRole.created_at ? format(new Date(currentRole.created_at), 'MMM dd, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Assigned Permissions</span>
            <Badge className="ml-2">{getPermissionCount()}</Badge>
          </CardTitle>
          <CardDescription>
            Permissions assigned to this role
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <p className="text-gray-600 mb-4">
                This role doesn't have any permissions assigned yet.
              </p>
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
    </div>
  );
} 