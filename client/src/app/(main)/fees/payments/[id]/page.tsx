"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Eye, Calendar, DollarSign, User, GraduationCap, AlertCircle } from 'lucide-react';
import { apiGet, API_ENDPOINTS } from '@/lib/api';

interface FeePayment {
  id: number;
  student_name: string;
  category_name: string;
  academic_year_name: string;
  term_name: string;
  amount_paid: string;
  payment_status: string;
  payment_method: string;
  payment_date: string;
  due_date: string;
  scholarship_name?: string;
  discount_amount?: string;
  notes?: string;
  student?: {
    student_name: string;
  };
  category?: {
    name: string;
  };
  academic_year?: {
    name: string;
  };
  term?: {
    name: string;
  };
  scholarship?: {
    name: string;
  };
}

export default function FeePaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [payment, setPayment] = useState<FeePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    apiGet<FeePayment>(API_ENDPOINTS.FEES + `payments/${id}/`)
      .then((data) => {
        setPayment(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching payment:', err);
        setError("Failed to load payment. Please try again.");
        setLoading(false);
      });
  }, [id]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 border-0">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return 'Not provided';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Payment</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Link href="/fees/payments">
              <Button variant="outline">
                Back to Payments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
          <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist or has been removed.</p>
          <Link href="/fees/payments">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Back to Payments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/fees/payments">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Payments</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fee Payment Details</h1>
              <p className="mt-2 text-gray-600">Payment ID: {payment.id}</p>
            </div>
            {getStatusBadge(payment.payment_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Amount Card */}
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Amount</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatCurrency(payment.amount_paid)}
                </div>
                <div className="text-sm text-gray-600">
                  Payment method: {payment.payment_method?.replace("_", " ")}
                </div>
              </CardContent>
            </Card>

            {/* Student Information */}
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Student Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Student Name</label>
                    <p className="text-gray-900">{payment.student_name || payment.student?.student_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fee Category</label>
                    <p className="text-gray-900">{payment.category_name || payment.category?.name || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Academic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Academic Year</label>
                    <p className="text-gray-900">{payment.academic_year_name || payment.academic_year?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Term</label>
                    <p className="text-gray-900">{payment.term_name || payment.term?.name || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(payment.scholarship_name || payment.scholarship?.name || payment.discount_amount || payment.notes) && (
              <Card className="bg-white shadow-sm border border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payment.scholarship_name || payment.scholarship?.name ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Scholarship</label>
                      <p className="text-gray-900">{payment.scholarship_name || payment.scholarship?.name}</p>
                    </div>
                  ) : null}
                  {payment.discount_amount ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Discount Amount</label>
                      <p className="text-gray-900">{formatCurrency(payment.discount_amount)}</p>
                    </div>
                  ) : null}
                  {payment.notes ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900 whitespace-pre-line">{payment.notes}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Details */}
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Date</label>
                  <p className="text-gray-900">{formatDate(payment.payment_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="text-gray-900">{formatDate(payment.due_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <div className="mt-1">
                    {getStatusBadge(payment.payment_status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/fees/payments" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Payments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 