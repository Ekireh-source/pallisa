'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { createRole, clearFieldErrors, fetchPermissions } from '@/store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save, X, Shield, CheckSquare, Square, Plus, User, Activity } from 'lucide-react';
import type { RoleCreateUpdate } from '@/types';

export default function CreateRolePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors, permissions, permissionCategories } = useAppSelector((state) => state.role);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

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

    // Fetch permissions when component mounts
    dispatch(fetchPermissions());
  }, [isAuthenticated, router, dispatch]);

  useEffect(() => {
    // Clear field errors when component mounts
    dispatch(clearFieldErrors());
  }, [dispatch]);

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
      const result = await dispatch(createRole(formData));
      
      if (createRole.fulfilled.match(result)) {
        router.push('/roles');
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleCancel = () => {
    router.push('/roles');
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
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create New Role</h1>
            <p className="text-indigo-100 text-base sm:text-lg">
              Define a new role and assign permissions
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-indigo-100 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Available Permissions: {permissions.length}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Categories: {permissionCategories.length}</span>
            </div>
            <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Selected: {getAllSelectedCount()}</span>
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
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex items-center space-x-2 text-red-700">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create a new role and assign permissions to it
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`h-11 ${fieldErrors.name ? "border-red-500" : ""}`}
                  placeholder="Enter role name" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter role description"
                rows={3}
                className="resize-none"
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span>Permissions</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Select the permissions to assign to this role
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
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
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleCancel} className="px-6 py-2">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="px-6 py-2 flex items-center space-x-2">
            {loading ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                <span>Creating Role...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Create Role</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 