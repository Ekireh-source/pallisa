'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ArrowLeft, Edit, Calendar, Clock, CheckCircle, AlertCircle, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getSalaryPeriod } from '@/lib/api';
import { SalaryPeriod } from '@/types';
import { toast } from 'sonner';

export default function SalaryPeriodDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<SalaryPeriod | null>(null);

  const periodId = params.id ? parseInt(params.id as string) : null;

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
  }, [isAuthenticated, router, periodId]);

  const fetchPeriod = async () => {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!period) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Salary period not found</p>
          <Link href="/salary-management/periods">
            <Button className="mt-4">Back to Periods</Button>
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
          <Link href="/salary-management/periods">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{period.name}</h1>
            <p className="text-gray-600 mt-2">
              Salary period details and information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {period.can_be_modified && (
            <Link href={`/salary-management/periods/${period.id}/edit`}>
              <Button className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Period</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{period.duration_days} days</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
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
                  {period.is_active ? 'Active' : period.is_closed ? 'Closed' : 'Pending'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                period.is_active ? 'bg-green-100' : period.is_closed ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {period.is_active ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : period.is_closed ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Academic Year</p>
                <p className="text-2xl font-bold text-gray-900">{period.academic_year}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core details about this salary period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Period Name</p>
                <p className="text-gray-900">{period.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Academic Year</p>
                <p className="text-gray-900">{period.academic_year}</p>
              </div>
              {period.term && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Term</p>
                  <p className="text-gray-900">Term {period.term}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date Information */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Date Information</CardTitle>
            <CardDescription>
              Start and end dates for this period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Start Date</p>
                <p className="text-gray-900">{formatDate(period.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Date</p>
                <p className="text-gray-900">{formatDate(period.end_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-gray-900">{period.duration_days} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="flex items-center space-x-2">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Technical details and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-gray-900">{formatDateTime(period.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDateTime(period.updated_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Modifiable</p>
              <Badge className={period.can_be_modified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {period.can_be_modified ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions for this salary period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/salary-management/payments">
              <Button variant="outline" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>View Payments</span>
              </Button>
            </Link>
            <Link href="/salary-management/reports">
              <Button variant="outline" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Generate Report</span>
              </Button>
            </Link>
            {period.can_be_modified && (
              <Link href={`/salary-management/periods/${period.id}/edit`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Period</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 