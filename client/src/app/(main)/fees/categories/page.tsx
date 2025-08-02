"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  Activity, 
  FileText, 
  AlertCircle,
  BarChart3,
  DollarSign,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiGet, apiDelete, API_ENDPOINTS } from '@/lib/api';

interface FeeCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function FeeCategoriesPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    apiGet<{ results: FeeCategory[] }>(API_ENDPOINTS.FEES + 'categories/')
      .then((data) => {
        setCategories(data.results || data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load categories");
        setLoading(false);
      });
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      setDeleting(id);
      try {
        await apiDelete(API_ENDPOINTS.FEES + `categories/${id}/`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Failed to delete category:', error);
      } finally {
        setDeleting(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Fee Categories</h1>
            <p className="text-blue-100 text-lg">
              Manage fee categories for better organization and reporting
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Total Categories: {categories.length}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Active Categories: {categories.filter(c => c.is_active).length}</span>
            </div>
          </div>
          <Link
            href="/fees/categories/create"
            className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-blue-600" />
            Search Fee Categories
          </h3>
        </div>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Loading Fee Categories
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
              No Fee Categories Found
            </h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No fee categories found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new fee category.'}
            </p>
            {!searchTerm && (
              <Link
                href="/fees/categories/create"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Category
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {category.name}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    {category.is_active ? (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-800">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 rounded-full">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-red-800">Inactive</span>
                      </div>
                    )}
                    <Link
                      href={`/fees/categories/${category.id}/edit`}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={deleting === category.id}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete category"
                    >
                      {deleting === category.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">Fee Category</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(category.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Fee Category Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Categories</p>
                    <p className="text-2xl font-bold text-blue-900">{categories.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Categories</p>
                    <p className="text-2xl font-bold text-green-900">
                      {categories.filter(c => c.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Inactive Categories</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {categories.filter(c => !c.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 