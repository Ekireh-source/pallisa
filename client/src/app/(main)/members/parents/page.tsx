'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchParents } from '@/store/slices/memberParentSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, LoadingSpinner } from '@/components/ui';
import { Plus, Search, User, ArrowUp, ArrowDown, X, Users, UserCheck, Activity, FileText, AlertCircle, Filter, RefreshCw, Edit, Trash2, Eye, Upload } from 'lucide-react';
import Link from 'next/link';
import type { MemberParent, UserProfile } from '@/types';

const RELATIONSHIP_TYPE_COLORS = {
  father: 'bg-blue-100 text-blue-800',
  mother: 'bg-pink-100 text-pink-800',
  guardian: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
};

const RELATIONSHIP_TYPE_LABELS = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  other: 'Other',
};

// Define a type for parent with user_profile_data
interface ParentWithProfile extends MemberParent {
  user_profile_data?: UserProfile & { get_full_name?: string; };
}

export default function ParentsPage() {
  const { parents, loading, error } = useAppSelector((state) => state.memberParents);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    dispatch(fetchParents({}));
  }, [isAuthenticated, dispatch]);

  const filteredParents = parents.filter((parent: ParentWithProfile) => {
    const matchesSearch = !searchTerm || 
      parent.user_profile_data?.get_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof parent.user_profile_data?.user === 'object' && parent.user_profile_data.user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      parent.relationship_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = relationshipTypeFilter === 'all' || parent.relationship_type === relationshipTypeFilter;
    
    return matchesSearch && matchesRelationship;
  });

  const sortedParents = [...filteredParents].sort((a: ParentWithProfile, b: ParentWithProfile) => {
    let aValue: string, bValue: string;

    switch (sortBy) {
      case 'name':
        aValue = a.user_profile_data?.get_full_name || '';
        bValue = b.user_profile_data?.get_full_name || '';
        break;
      case 'email':
        aValue = typeof a.user_profile_data?.user === 'object' ? a.user_profile_data.user.email || '' : '';
        bValue = typeof b.user_profile_data?.user === 'object' ? b.user_profile_data.user.email || '' : '';
        break;
      case 'relationship':
        aValue = a.relationship_type || '';
        bValue = b.relationship_type || '';
        break;
      default:
        aValue = a.user_profile_data?.get_full_name || '';
        bValue = b.user_profile_data?.get_full_name || '';
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const getRelationshipTypeColor = (type: string) => {
    return RELATIONSHIP_TYPE_COLORS[type as keyof typeof RELATIONSHIP_TYPE_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const getRelationshipTypeLabel = (type: string) => {
    return RELATIONSHIP_TYPE_LABELS[type as keyof typeof RELATIONSHIP_TYPE_LABELS] || type;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setRelationshipTypeFilter('all');
    setShowFilters(false);
  };

  // Calculate statistics
  const totalParents = parents.length;
  const fathers = parents.filter(parent => parent.relationship_type === 'father').length;
  const mothers = parents.filter(parent => parent.relationship_type === 'mother').length;
  const guardians = parents.filter(parent => parent.relationship_type === 'guardian').length;

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
            <Users className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Parents & Guardians</h1>
            <p className="text-green-100 text-base sm:text-lg">
              Manage parent and guardian information, relationships, and contact details
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-green-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Total: {totalParents}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Fathers: {fathers}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Mothers: {mothers}</span>
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
              href="/members/parents/create"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Parent
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
              Total Parents
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{totalParents}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                All Parents
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Fathers
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{fathers}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Male Parents
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Mothers
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{mothers}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-pink-100 text-pink-700">
                Female Parents
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Guardians
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{guardians}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Legal Guardians
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
                <span>Search Parents</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Find parents by name, email, or relationship type
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                {showFilters ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Filter className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Show'} Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch(fetchParents({}));
                }}
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
                    placeholder="Search parents by name, email, or relationship..."
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
                      Relationship Type
                    </label>
                    <select
                      value={relationshipTypeFilter}
                      onChange={(e) => setRelationshipTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Types</option>
                      {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="email">Sort by Email</option>
                      <option value="relationship">Sort by Relationship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center space-x-2"
                    >
                      {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                    </button>
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
                      <X className="w-4 h-4" />
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

      {/* Parents Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>Parents & Guardians ({sortedParents.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage parent records and view detailed information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Parents</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => dispatch(fetchParents({}))}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            </div>
          ) : sortedParents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || relationshipTypeFilter !== 'all' 
                  ? 'No parents found matching your criteria' 
                  : 'No parents found'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || relationshipTypeFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filters'
                  : 'Get started by adding your first parent or guardian'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                {(searchTerm || relationshipTypeFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
                {!(searchTerm || relationshipTypeFilter !== 'all') && (
                  <Link href="/members/parents/create" className="w-full sm:w-auto">
                    <Button className="flex items-center space-x-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      <span>Add First Parent</span>
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
                      Parent
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Relationship
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Occupation
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedParents.map((parent: ParentWithProfile) => (
                    <tr key={parent.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-green-600">
                              {parent.user_profile_data?.get_full_name?.charAt(0) || 'P'}
                            </span>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {parent.user_profile_data?.get_full_name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {parent.relationship_type ? getRelationshipTypeLabel(parent.relationship_type) : 'Relationship not specified'}
                            </div>
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              {typeof parent.user_profile_data?.user === 'object' && parent.user_profile_data.user.email ? parent.user_profile_data.user.email : 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {typeof parent.user_profile_data?.user === 'object' && parent.user_profile_data.user.email ? parent.user_profile_data.user.email : 'No email'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRelationshipTypeColor(parent.relationship_type)}`}>
                          {getRelationshipTypeLabel(parent.relationship_type)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {parent.user_profile_data?.phone || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-900 truncate">
                          {parent.occupation || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link href={`/members/parents/${parent.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </Link>
                          <Link href={`/members/parents/${parent.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 px-2 py-1 h-8"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Implement delete */}}
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
    </div>
  );
} 