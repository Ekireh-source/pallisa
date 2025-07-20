'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getSalaryPeriods, deleteSalaryPeriod } from '@/lib/api';
import { SalaryPeriod } from '@/types';
import { toast } from 'sonner';

export default function SalaryPeriodsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [periods, setPeriods] = useState<SalaryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await getSalaryPeriods();
      setPeriods(data);
    } catch (error) {
      console.error('Error fetching salary periods:', error);
      toast.error('Failed to fetch salary periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchPeriods();
  }, [isAuthenticated, router]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this salary period? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteSalaryPeriod(id);
      toast.success('Salary period deleted successfully');
      // Refresh the list
      fetchPeriods();
    } catch (error) {
      console.error('Error deleting salary period:', error);
      toast.error('Failed to delete salary period');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Salary Periods</h1>
          <p className="text-gray-600 mt-2">
            Manage salary periods for monthly and termly payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/salary-management/periods/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Period</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Periods</p>
                <p className="text-2xl font-bold text-gray-900">{periods.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Period</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => p.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed Periods</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => p.is_closed).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter(p => !p.is_active && !p.is_closed).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Salary Periods</CardTitle>
          <CardDescription>
            All salary periods for managing payment schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : periods.length > 0 ? (
            <div className="space-y-4">
              {periods.map((period) => (
                <div key={period.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{period.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
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
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/salary-management/periods/${period.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {period.can_be_modified && (
                      <Link href={`/salary-management/periods/${period.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    {period.can_be_modified && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(period.id)}
                        disabled={deletingId === period.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === period.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No salary periods</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first salary period
              </p>
              <Link href="/salary-management/periods/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Period
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 