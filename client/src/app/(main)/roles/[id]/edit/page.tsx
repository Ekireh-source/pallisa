'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchRoleById, updateRole, clearFieldErrors, fetchPermissions } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, Shield, CheckSquare, Square } from 'lucide-react';
import type { RoleCreateUpdate, Permission, PermissionCategory } from '@/types';

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentRole, loading, error, fieldErrors, permissions, permissionCategories } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const roleId = Number(params.id);

  const [formData, setFormData] = useState<RoleCreateUpdate>({
    name: '',
    description: '',
    permissions: [],
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch role and permissions when component mounts
    if (roleId) {
      dispatch(fetchRoleById(roleId));
    }
    dispatch(fetchPermissions());
  }, [isAuthenticated, router, dispatch, roleId]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
  }, [dispatch]);

  useEffect(() => {
    // Update form data when currentRole is loaded
    if (currentRole) {
      setFormData({
        name: currentRole.name,
        description: currentRole.description || '',
        permissions: currentRole.permissions?.map(p => p.id) || [],
      });
      setSelectedPermissions(new Set(currentRole.permissions?.map(p => p.id) || []));
    }
  }, [currentRole]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldErrors());
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
    setFormData(prev => ({
      ...prev,
      permissions: Array.from(newSelected)
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelectAllInCategory = (categoryId: number) => {
    const categoryPermissions = permissions.filter(p => p.category.id === categoryId);
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const newSelected = new Set(selectedPermissions);
    
    // Check if all permissions in category are selected
    const allSelected = categoryPermissionIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // Remove all permissions from this category
      categoryPermissionIds.forEach(id => newSelected.delete(id));
    } else {
      // Add all permissions from this category
      categoryPermissionIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedPermissions(newSelected);
    setFormData(prev => ({
      ...prev,
      permissions: Array.from(newSelected)
    }));
  };

  const handleSelectAll = () => {
    const allPermissionIds = permissions.map(p => p.id);
    const newSelected = new Set(selectedPermissions);
    
    // Check if all permissions are selected
    const allSelected = allPermissionIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // Remove all permissions
      setSelectedPermissions(new Set());
      setFormData(prev => ({
        ...prev,
        permissions: []
      }));
    } else {
      // Add all permissions
      setSelectedPermissions(new Set(allPermissionIds));
      setFormData(prev => ({
        ...prev,
        permissions: allPermissionIds
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(updateRole({ id: roleId, data: formData }));
      
      if (updateRole.fulfilled.match(result)) {
        router.push(`/roles/${roleId}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/roles/${roleId}`);
  };

  const getPermissionsByCategory = (categoryId: number) => {
    return permissions.filter(p => p.category.id === categoryId);
  };

  const getSelectedCountInCategory = (categoryId: number) => {
    const categoryPermissions = getPermissionsByCategory(categoryId);
    return categoryPermissions.filter(p => selectedPermissions.has(p.id)).length;
  };

  const getAllSelectedCount = () => {
    return selectedPermissions.size;
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

  if (loading && !currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (error && !currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/roles/${roleId}`}>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Role</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Role: {currentRole.name}</h1>
            <p className="text-gray-600 mt-1">Update role details and permissions</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription>
              Update the role's basic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldErrors.name ? "border-red-500" : ""}
                  placeholder="Enter role name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter role description"
                rows={3}
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Permissions</span>
            </CardTitle>
            <CardDescription>
              Select the permissions to assign to this role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Select All Button */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectAll}
                className="flex items-center space-x-2"
              >
                {getAllSelectedCount() === permissions.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>
                  {getAllSelectedCount() === permissions.length ? 'Deselect All' : 'Select All'}
                </span>
              </Button>
              <span className="text-sm text-gray-500">
                {getAllSelectedCount()} of {permissions.length} permissions selected
              </span>
            </div>

            {/* Permission Categories */}
            <div className="space-y-4">
              {permissionCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryToggle(category.id)}
                        className="p-1"
                      >
                        {expandedCategories.has(category.id) ? '▼' : '▶'}
                      </Button>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        {getSelectedCountInCategory(category.id)} of {getPermissionsByCategory(category.id).length}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllInCategory(category.id)}
                        className="flex items-center space-x-1"
                      >
                        {getSelectedCountInCategory(category.id) === getPermissionsByCategory(category.id).length ? (
                          <CheckSquare className="h-3 w-3" />
                        ) : (
                          <Square className="h-3 w-3" />
                        )}
                        <span className="text-xs">
                          {getSelectedCountInCategory(category.id) === getPermissionsByCategory(category.id).length ? 'Deselect' : 'Select All'}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  {expandedCategories.has(category.id) && (
                    <div className="p-4 space-y-2">
                      {getPermissionsByCategory(category.id).map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePermissionToggle(permission.id)}
                            className="p-1"
                          >
                            {selectedPermissions.has(permission.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex items-center space-x-2">
            {loading ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                <span>Updating Role...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Update Role</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 