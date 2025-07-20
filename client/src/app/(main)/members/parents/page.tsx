'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { Plus, Edit, Trash2, Eye, Search, UserCheck, Mail, Phone, Users } from 'lucide-react';

const RELATIONSHIP_TYPE_COLORS = {
  father: 'bg-blue-100 text-blue-800',
  mother: 'bg-pink-100 text-pink-800',
  guardian: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

const RELATIONSHIP_TYPE_LABELS = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
  other: 'Other',
};

export default function ParentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data - replace with actual data from Redux store
  const parents = [];
  const loading = false;
  const error = null;
  const totalCount = 0;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parent/guardian record? This action cannot be undone.')) {
      try {
        // Add delete logic here
        console.log('Delete parent:', id);
      } catch (error) {
        console.error('Error deleting parent:', error);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
          <h1 className="text-2xl font-bold text-gray-900">Pallisa High School Parents & Guardians</h1>
          <p className="text-gray-600 mt-1">Manage parent and guardian records for student families</p>
        </div>
        <Link href="/members/parents/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Parent/Guardian</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search parents and guardians..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedType}
                onChange={handleTypeFilter}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Relationships</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parents List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Parent & Guardian Registry ({totalCount})</span>
          </CardTitle>
          <CardDescription>
            Manage parent and guardian information and contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Loading parents and guardians...</span>
            </div>
          ) : parents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parents or guardians found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType
                  ? 'No records match your current search criteria.'
                  : 'Get started by adding parent and guardian records.'}
              </p>
              {!searchTerm && !selectedType && (
                <Link href="/members/parents/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Parent/Guardian
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* This will be populated when parent data is available */}
              <p className="text-gray-500 text-center py-8">Parent management functionality coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 