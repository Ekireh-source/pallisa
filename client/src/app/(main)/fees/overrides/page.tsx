"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Edit2, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface FeeOverride {
  id: number;
  student_name: string;
  category_name: string;
  academic_year_name: string;
  term_name: string;
  override_amount: string;
  is_active: boolean;
}

export default function FeeOverridesPage() {
  const [overrides, setOverrides] = useState<FeeOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    apiGet<{ results: FeeOverride[] }>(API_ENDPOINTS.FEES + 'overrides/')
      .then((data) => {
        setOverrides(data.results || data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load fee overrides");
        setLoading(false);
      });
  }, []);

  const filteredOverrides = overrides.filter(o =>
    o.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.academic_year_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.term_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Fee Overrides</h1>
              <p className="mt-2 text-gray-600">
                Manage custom fee overrides for individual students
              </p>
            </div>
            <Link
              href="/fees/overrides/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Override
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search overrides</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search overrides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Overrides Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filteredOverrides.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 5l4 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No overrides found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new override.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/fees/overrides/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Override
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOverrides.map((override) => (
              <div key={override.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {override.student_name} - {override.category_name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1">
                        {override.academic_year_name} &bull; {override.term_name}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/fees/overrides/${override.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit override"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Override Amount: <span className="font-semibold text-gray-900">{override.override_amount}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      override.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    )}>
                      {override.is_active ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      {override.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {overrides.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Total Overrides</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{overrides.length}</div>
              </div>
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Active Overrides</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {overrides.filter(o => o.is_active).length}
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 truncate">Inactive Overrides</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {overrides.filter(o => !o.is_active).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 