'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { 
  Plus, 
  Edit, 
  Eye, 
  Home,
  Car,
  Heart,
  Award,
  Clock,
  Gift,
  Settings,
  Trash2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getSalaryAllowances, deleteSalaryAllowance } from '@/lib/api';
import { SalaryAllowance } from '@/types';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui';

export default function SalaryAllowancesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAllowance, setDeletingAllowance] = useState<SalaryAllowance | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchAllowances = async () => {
      try {
        setLoading(true);
        const data = await getSalaryAllowances();
        setAllowances(data);
      } catch (error) {
        console.error('Error fetching allowances:', error);
        toast.error('Failed to fetch salary allowances');
      } finally {
        setLoading(false);
      }
    };

    fetchAllowances();
  }, [isAuthenticated, router]);

  const handleDelete = async () => {
    if (!deletingAllowance) return;

    try {
      setDeleting(true);
      await deleteSalaryAllowance(deletingAllowance.id);
      toast.success('Salary allowance deleted successfully');
      setAllowances(prev => prev.filter(a => a.id !== deletingAllowance.id));
      setShowDeleteModal(false);
      setDeletingAllowance(null);
    } catch (error) {
      console.error('Error deleting allowance:', error);
      toast.error('Failed to delete salary allowance');
    } finally {
      setDeleting(false);
    }
  };

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
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'transport':
        return <Car className="h-5 w-5 text-green-600" />;
      case 'medical':
        return <Heart className="h-5 w-5 text-red-600" />;
      case 'responsibility':
        return <Award className="h-5 w-5 text-purple-600" />;
      case 'overtime':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'bonus':
        return <Gift className="h-5 w-5 text-pink-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Salary Allowances</h1>
          <p className="text-gray-600 mt-2">
            Configure and manage salary allowances for staff
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/salary-management/allowances/create">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Allowance</span>
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
                <p className="text-sm font-medium text-gray-600">Total Allowances</p>
                <p className="text-2xl font-bold text-gray-900">{allowances.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Allowances</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allowances.filter(a => a.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fixed Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allowances.filter(a => !a.is_percentage).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Percentage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allowances.filter(a => a.is_percentage).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allowances List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Salary Allowances</CardTitle>
          <CardDescription>
            All configured salary allowances for staff
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
          ) : allowances.length > 0 ? (
            <div className="space-y-4">
              {allowances.map((allowance) => (
                <div key={allowance.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      {getAllowanceIcon(allowance.allowance_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{allowance.name}</h3>
                      <p className="text-sm text-gray-600">
                        {allowance.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getAllowanceColor(allowance.allowance_type)}>
                          {allowance.allowance_type}
                        </Badge>
                        <Badge className={allowance.is_percentage ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}>
                          {allowance.is_percentage ? 'Percentage' : 'Fixed Amount'}
                        </Badge>
                        {allowance.is_active && (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {allowance.is_percentage ? `${allowance.amount}%` : formatCurrency(allowance.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {allowance.is_percentage ? 'of base salary' : 'per month'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/salary-management/allowances/${allowance.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/salary-management/allowances/${allowance.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingAllowance(allowance);
                          setShowDeleteModal(true);
                        }}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No salary allowances</h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first salary allowance
              </p>
              <Link href="/salary-management/allowances/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Allowance
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingAllowance(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Allowance"
        message={`Are you sure you want to delete "${deletingAllowance?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
} 