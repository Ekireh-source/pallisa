'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Edit, Home, Car, Heart, Award, Clock, Gift, Settings, Activity, FileText, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getSalaryAllowance } from '@/lib/api';
import { SalaryAllowance } from '@/types';
import { toast } from 'sonner';

export default function SalaryAllowanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [allowance, setAllowance] = useState<SalaryAllowance | null>(null);

  const allowanceId = params.id ? parseInt(params.id as string) : null;

  const fetchAllowance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryAllowance(allowanceId!);
      setAllowance(data);
    } catch (error) {
      console.error('Error fetching allowance:', error);
      toast.error('Failed to fetch salary allowance');
      router.push('/salary-management/allowances');
    } finally {
      setLoading(false);
    }
  }, [allowanceId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!allowanceId) {
      toast.error('Invalid allowance ID');
      router.push('/salary-management/allowances');
      return;
    }

    fetchAllowance();
  }, [isAuthenticated, router, allowanceId, fetchAllowance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAllowanceIcon = (type: string) => {
    switch (type) {
      case 'housing':
        return <Home className="h-6 w-6 text-blue-600" />;
      case 'transport':
        return <Car className="h-6 w-6 text-green-600" />;
      case 'medical':
        return <Heart className="h-6 w-6 text-red-600" />;
      case 'responsibility':
        return <Award className="h-6 w-6 text-purple-600" />;
      case 'overtime':
        return <Clock className="h-6 w-6 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-6 w-6 text-pink-600" />;
      default:
        return <Settings className="h-6 w-6 text-gray-600" />;
    }
  };

  const getAllowanceColor = (type: string) => {
    switch (type) {
      case 'housing':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'responsibility':
        return 'bg-purple-100 text-purple-800';
      case 'overtime':
        return 'bg-orange-100 text-orange-800';
      case 'bonus':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!allowance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary allowance not found</p>
          <Link href="/salary-management/allowances">
            <Button className="mt-4">Back to Allowances</Button>
          </Link>
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
            {getAllowanceIcon(allowance.allowance_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{allowance.name}</h1>
            <p className="text-green-100 text-base sm:text-lg">
              {allowance.is_percentage ? `${allowance.amount}% of base salary` : `${formatCurrency(allowance.amount)} per month`}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-4 text-green-100 text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Type: {allowance.allowance_type.replace('_', ' ')}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Status: {allowance.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="w-1 h-1 bg-green-300 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>{allowance.is_percentage ? 'Percentage' : 'Fixed Amount'}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-3">
            <Link
              href="/salary-management/allowances"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Allowances
            </Link>
            <Link
              href={`/salary-management/allowances/${allowance.id}/edit`}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer relative z-10"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Edit Allowance
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Amount
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {allowance.is_percentage ? `${allowance.amount}%` : formatCurrency(allowance.amount)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {allowance.is_percentage ? 'of base salary' : 'per month'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Type
            </CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 capitalize">
              {allowance.allowance_type.replace('_', ' ')}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Badge className={getAllowanceColor(allowance.allowance_type)}>
                {allowance.allowance_type.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Status
            </CardTitle>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${allowance.is_active ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-4 h-4 sm:w-5 sm:h-5 ${allowance.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {allowance.is_active ? '✓' : '✗'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {allowance.is_active ? 'Active' : 'Inactive'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Badge className={allowance.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {allowance.is_active ? 'Currently Active' : 'Currently Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allowance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span>Basic Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Core details about this salary allowance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Allowance Name</p>
                  <p className="text-gray-900 font-semibold">{allowance.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Allowance Type</p>
                  <Badge className={getAllowanceColor(allowance.allowance_type)}>
                    {allowance.allowance_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount</p>
                  <p className="text-gray-900 font-semibold">
                    {allowance.is_percentage ? `${allowance.amount}%` : formatCurrency(allowance.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Type</p>
                  <Badge className={allowance.is_percentage ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}>
                    {allowance.is_percentage ? 'Percentage' : 'Fixed Amount'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span>Status Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Current status and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center space-x-2">
                    {allowance.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Usage</p>
                  <p className="text-gray-900">
                    {allowance.is_percentage ? 'of base salary' : 'per month'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {allowance.description && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span>Description</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Detailed description of this allowance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-gray-900">{allowance.description}</p>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>System Information</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{formatDateTime(allowance.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(allowance.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common actions for this salary allowance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-4">
            <Link href={`/salary-management/allowances/${allowance.id}/edit`}>
              <Button className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Allowance</span>
              </Button>
            </Link>
            <Link href="/salary-management/payments">
              <Button variant="outline" className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>View Payments</span>
              </Button>
            </Link>
            <Link href="/salary-management/allowances">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Allowances</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 