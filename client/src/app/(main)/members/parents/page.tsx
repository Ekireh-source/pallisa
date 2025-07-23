'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchParents } from '@/store/slices/memberParentSlice';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus, Search, User, Phone, Briefcase, ArrowUp, ArrowDown, X, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    dispatch(fetchParents({}));
  }, [isAuthenticated, dispatch]);

  const filteredParents = parents.filter((parent: ParentWithProfile) =>
    parent.user_profile_data?.get_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof parent.user_profile_data?.user === 'object' && parent.user_profile_data.user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    parent.relationship_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents & Guardians</h1>
          <p className="text-gray-600 mt-1">Manage parent and guardian information</p>
        </div>
        <Link href="/members/parents/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Parent</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search parents by name, email, or relationship..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="relationship">Sort by Relationship</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Parents List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-gray-600">Loading parents...</span>
        </div>
      ) : sortedParents.length === 0 ? (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No parents match your search criteria.' : 'Get started by adding your first parent or guardian.'}
              </p>
              {!searchTerm && (
                <Link href="/members/parents/create">
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Parent</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedParents.map((parent: ParentWithProfile) => (
            <Card key={parent.id} className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {parent.user_profile_data?.get_full_name || 'Unknown Name'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {typeof parent.user_profile_data?.user === 'object' && parent.user_profile_data.user.email ? parent.user_profile_data.user.email : 'No email'}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipTypeColor(parent.relationship_type)}`}>
                      {getRelationshipTypeLabel(parent.relationship_type)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {parent.user_profile_data?.phone && (
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {parent.user_profile_data.phone}
                    </p>
                  )}
                  {parent.occupation && (
                    <p className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      {parent.occupation}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/members/parents/${parent.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 