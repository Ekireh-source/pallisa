'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner, ConfirmationModal } from '@/components/ui';
import { ArrowLeft, Edit, Calendar, DollarSign, Users, Clock, CheckCircle, AlertCircle, Trash2, AlertTriangle, Activity, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPeriod, deleteSalaryPeriod } from '@/lib/api';
import { SalaryPeriod } from '@/types';
import { toast } from 'sonner';

export default function SalaryPeriodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<SalaryPeriod | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const periodId = params.id ? parseInt(params.id as string) : null;

  const fetchPeriod = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryPeriod(periodId!);
      setPeriod(data);
    } catch (error) {
      console.error('Error fetching salary period:', error);
      toast.error('Failed to fetch salary period');
      router.push('/salary-management/periods');
    } finally {
      setLoading(false);
    }
  }, [periodId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!periodId) {
      toast.error('Invalid period ID');
      router.push('/salary-management/periods');
      return;
    }

    fetchPeriod();
  }, [isAuthenticated, router, periodId, fetchPeriod]);

  const handleDelete = async () => {
    if (!period) return;

    setDeleteLoading(true);
    try {
      await deleteSalaryPeriod(period.id);
      toast.success('Salary period deleted successfully');
      router.push('/salary-management/periods');
    } catch (err) {
      console.error('Error deleting period:', err);
      toast.error("Failed to delete period. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Period Not Found</h1>
          <p className="text-gray-600 mb-6">The period you're looking for doesn't exist or has been removed.</p>
          <Link href="/salary-management/periods">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Back to Periods
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{period.name}</h1>
            <p className="text-blue-100 text-base sm:text-lg">
              {period.academic_year_name} - {period.term_name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Status: {period.is_active ? 'Active' : period.is_closed ? 'Closed' : 'Pending'}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>ID: {period.id}</span>
            </div>
            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{formatDate(period.start_date)} - {formatDate(period.end_date)}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/salary-management/periods"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Periods
            </Link>
            {period.can_be_modified && (
              <Link
                href={`/salary-management/periods/${period.id}/edit`}
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Edit Period
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Period Name
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {period.name}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Salary Period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Status
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {period.is_active ? 'Active' : period.is_closed ? 'Closed' : 'Pending'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Badge className={period.is_active ? 'bg-green-100 text-green-700' : period.is_closed ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                {period.is_active ? 'Active' : period.is_closed ? 'Closed' : 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Academic Year
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {period.academic_year_name}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Academic Year
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Term
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {period.term_name}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                Term
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span>Period Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Core details about this salary period
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Period Name</p>
                <p className="text-gray-900 font-semibold">{period.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Academic Year</p>
                <p className="text-gray-900">{period.academic_year_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Term</p>
              <p className="text-gray-900">{period.term_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span>Date Range</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Start and end dates for this period
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Start Date</p>
                <p className="text-gray-900 font-semibold">{formatDate(period.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Date</p>
                <p className="text-gray-900 font-semibold">{formatDate(period.end_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Status Information</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Current status and permissions for this period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="mt-1">
                {period.is_active && (
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                )}
                {period.is_closed && (
                  <Badge className="bg-red-100 text-red-800">
                    Closed
                  </Badge>
                )}
                {!period.is_active && !period.is_closed && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Modifiable</p>
              <p className="text-gray-900">{period.can_be_modified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>System Information</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{formatDateTime(period.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(period.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common actions for this salary period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            {period.can_be_modified && (
              <Link href={`/salary-management/periods/${period.id}/edit`}>
                <Button className="flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Period</span>
                </Button>
              </Link>
            )}
            {period.can_be_modified && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Period</span>
              </Button>
            )}
            <Link href="/salary-management/periods">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Periods</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Period"
        message={`Are you sure you want to delete "${period.name}"? This will permanently remove the period record.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
} 