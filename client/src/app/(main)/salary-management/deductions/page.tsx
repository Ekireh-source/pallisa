'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Plus, Search, Filter, Edit, Trash2, Eye, TrendingDown, Shield, Heart, Clock, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';
import { getSalaryDeductions, deleteSalaryDeduction } from '@/lib/api';
import { SalaryDeduction } from '@/types';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui';

export default function SalaryDeductionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [deductions, setDeductions] = useState<SalaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDeduction, setDeletingDeduction] = useState<SalaryDeduction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDeductions();
  }, [isAuthenticated, router]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      const data = await getSalaryDeductions();
      setDeductions(data);
    } catch (error) {
      console.error('Error loading deductions:', error);
      toast.error('Failed to load salary deductions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDeduction) return;

    try {
      setDeleting(true);
      await deleteSalaryDeduction(deletingDeduction.id);
      toast.success('Salary deduction deleted successfully');
      setDeductions(prev => prev.filter(d => d.id !== deletingDeduction.id));
      setShowDeleteModal(false);
      setDeletingDeduction(null);
    } catch (error) {
      console.error('Error deleting deduction:', error);
      toast.error('Failed to delete salary deduction');
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

  const getDeductionIcon = (type: string) => {
    switch (type) {
      case 'tax':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'insurance':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'medical':
        return <Heart className="h-5 w-5 text-green-600" />;
      case 'loan':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'advance':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
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

  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = deduction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || deduction.deduction_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && deduction.is_active) ||
                         (filterStatus === 'inactive' && !deduction.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Salary Deductions</h1>
          <p className="text-gray-600 mt-2">
            Manage salary deductions for staff members
          </p>
        </div>
        <Link href="/salary-management/deductions/create">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Deduction</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search deductions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Deduction Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deductions List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Deductions ({filteredDeductions.length})</CardTitle>
          <CardDescription>
            List of all salary deductions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading deductions...</span>
            </div>
          ) : filteredDeductions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deductions found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType || filterStatus 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first salary deduction.'
                }
              </p>
              {!searchTerm && !filterType && !filterStatus && (
                <Link href="/salary-management/deductions/create">
                  <Button>Create First Deduction</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getDeductionIcon(deduction.deduction_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{deduction.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getDeductionColor(deduction.deduction_type)}>
                          {deduction.deduction_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={deduction.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {deduction.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {deduction.description && (
                        <p className="text-sm text-gray-600 mt-1">{deduction.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {deduction.is_percentage ? `${deduction.amount}%` : formatCurrency(deduction.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {deduction.is_percentage ? 'of base salary' : 'per month'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link href={`/salary-management/deductions/${deduction.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/salary-management/deductions/${deduction.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingDeduction(deduction);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDeduction(null);
        }}
        onConfirm={handleDelete}
        title="Delete Salary Deduction"
        message={`Are you sure you want to delete "${deletingDeduction?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
} 