'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ArrowLeft, Edit, TrendingDown, Shield, Heart, Clock, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';
import { getSalaryDeduction } from '@/lib/api';
import { SalaryDeduction } from '@/types';
import { toast } from 'sonner';

export default function SalaryDeductionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [deduction, setDeduction] = useState<SalaryDeduction | null>(null);

  const deductionId = params.id ? parseInt(params.id as string) : null;

  const fetchDeduction = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSalaryDeduction(deductionId!);
      setDeduction(data);
    } catch (error) {
      console.error('Error fetching deduction:', error);
      toast.error('Failed to fetch salary deduction');
      router.push('/salary-management/deductions');
    } finally {
      setLoading(false);
    }
  }, [deductionId, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!deductionId) {
      toast.error('Invalid deduction ID');
      router.push('/salary-management/deductions');
      return;
    }

    fetchDeduction();
  }, [isAuthenticated, router, deductionId, fetchDeduction]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDeductionIcon = (type: string) => {
    switch (type) {
      case 'tax':
        return <TrendingDown className="h-6 w-6 text-red-600" />;
      case 'insurance':
        return <Shield className="h-6 w-6 text-blue-600" />;
      case 'medical':
        return <Heart className="h-6 w-6 text-green-600" />;
      case 'loan':
        return <Clock className="h-6 w-6 text-orange-600" />;
      case 'advance':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Settings className="h-6 w-6 text-gray-600" />;
    }
  };

  const getDeductionColor = (type: string) => {
    switch (type) {
      case 'tax':
        return 'bg-red-100 text-red-800';
      case 'insurance':
        return 'bg-blue-100 text-blue-800';
      case 'medical':
        return 'bg-green-100 text-green-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      case 'advance':
        return 'bg-yellow-100 text-yellow-800';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!deduction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary deduction not found</p>
          <Link href="/salary-management/deductions">
            <Button className="mt-4">Back to Deductions</Button>
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
          <Link href="/salary-management/deductions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deduction.name}</h1>
            <p className="text-gray-600 mt-2">
              Salary deduction details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/salary-management/deductions/${deduction.id}/edit`}>
            <Button className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Deduction</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deduction.is_percentage ? `${deduction.amount}%` : formatCurrency(deduction.amount)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                {getDeductionIcon(deduction.deduction_type)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {deduction.deduction_type.replace('_', ' ')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deduction.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${deduction.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`h-6 w-6 ${deduction.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {deduction.is_active ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deduction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core details about this salary deduction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Deduction Name</p>
                <p className="text-gray-900">{deduction.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Deduction Type</p>
                <Badge className={getDeductionColor(deduction.deduction_type)}>
                  {deduction.deduction_type.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="text-gray-900">
                  {deduction.is_percentage ? `${deduction.amount}%` : formatCurrency(deduction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Type</p>
                <Badge className={deduction.is_percentage ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}>
                  {deduction.is_percentage ? 'Percentage' : 'Fixed Amount'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Status Information</CardTitle>
            <CardDescription>
              Current status and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="flex items-center space-x-2">
                  {deduction.is_active ? (
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
                  {deduction.is_percentage ? 'of base salary' : 'per month'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {deduction.description && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>
              Detailed description of this deduction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{deduction.description}</p>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{formatDateTime(deduction.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(deduction.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for this salary deduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href={`/salary-management/deductions/${deduction.id}/edit`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Deduction</span>
              </Button>
            </Link>
            <Link href="/salary-management/payments">
              <Button variant="outline" className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4" />
                <span>View Payments</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 