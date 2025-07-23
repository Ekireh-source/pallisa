'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { BarChart3, TrendingUp, Download, FileText } from 'lucide-react';

interface SalaryReport {
  id: number;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'analytics';
  period: string;
  generated_at: string;
  file_url?: string;
}

export default function SalaryReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [reports, setReports] = useState<SalaryReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // TODO: Fetch salary reports data
    // For now, using mock data
    setReports([
      {
        id: 1,
        name: 'January 2024 Salary Summary',
        description: 'Complete salary summary for January 2024',
        type: 'summary',
        period: 'January 2024',
        generated_at: '2024-01-31T00:00:00Z',
        file_url: '/reports/january-2024-summary.pdf'
      },
      {
        id: 2,
        name: 'Q1 2024 Salary Analytics',
        description: 'Quarterly salary analytics and trends',
        type: 'analytics',
        period: 'Q1 2024',
        generated_at: '2024-03-31T00:00:00Z',
        file_url: '/reports/q1-2024-analytics.pdf'
      },
      {
        id: 3,
        name: 'Staff Salary Breakdown',
        description: 'Detailed breakdown by staff category',
        type: 'detailed',
        period: 'January 2024',
        generated_at: '2024-01-31T00:00:00Z',
        file_url: '/reports/staff-breakdown.pdf'
      }
    ]);
    setLoading(false);
  }, [isAuthenticated, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'detailed':
        return <BarChart3 className="h-5 w-5 text-green-600" />;
      case 'analytics':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'summary':
        return 'bg-blue-100 text-blue-800';
      case 'detailed':
        return 'bg-green-100 text-green-800';
      case 'analytics':
        return 'bg-purple-100 text-purple-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Salary Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate and view salary reports and analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Summary Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.type === 'summary').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analytics Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.type === 'analytics').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Detailed Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.type === 'detailed').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Monthly Summary</span>
            </CardTitle>
            <CardDescription>
              Generate monthly salary summary report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Create a comprehensive summary of all salary payments for a specific month
              </p>
              <Button variant="outline" className="w-full">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Analytics Report</span>
            </CardTitle>
            <CardDescription>
              Generate salary analytics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                View salary trends, comparisons, and performance analytics
              </p>
              <Button variant="outline" className="w-full">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span>Staff Breakdown</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown by staff category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Detailed analysis of salaries by staff type and department
              </p>
              <Button variant="outline" className="w-full">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            All generated salary reports and analytics
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
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      {getReportIcon(report.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-600">
                        {report.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getReportColor(report.type)}>
                          {report.type}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {report.period}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Generated: {formatDate(report.generated_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.file_url && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated</h3>
              <p className="text-gray-600 mb-4">
                Generate your first salary report to get started
              </p>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 