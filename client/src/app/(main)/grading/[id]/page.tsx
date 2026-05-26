'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Layers,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Label,
} from '@/components/ui';
import { FetchGradingSystemById } from '@/features/reports/reports.service';
import { toast } from 'sonner';
import { GradingSystem } from '@/types';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function GradingSystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [system, setSystem] = useState<GradingSystem | null>(null);

  const loadSystem = async () => {
    setLoading(true);
    const result = await FetchGradingSystemById(id);
    if (result.success) {
      setSystem(result.data);
    } else {
      toast.error("Failed to load grading system");
      router.push('/grading');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSystem();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;
  }

  if (!system) {
    return null;
  }

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_GRADING}>
    <MainLayout
      title={system.name}
      description="Grading system details and boundaries."
      backButton={
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      headerActions={
        <Button className="shadow-sm border border-transparent rounded-xl h-11 bg-white text-primary hover:bg-gray-100 font-bold px-6" asChild>
          <Link href={`/grading/${system.id}/edit`}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit System
          </Link>
        </Button>
      }
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Boundaries Table */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                Grade Boundaries
              </h3>
              <Badge variant="outline" className="rounded-full">
                {system.boundaries?.length || 0} grades total
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Score Range</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {system.boundaries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        No grades defined for this system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    system.boundaries?.map((boundary) => (
                      <TableRow key={boundary.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge className="bg-indigo-50 text-indigo-700 border-none px-3 py-1 text-sm rounded-md font-bold hover:bg-indigo-50">
                            {boundary.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-gray-700">
                          {boundary.min_score} - {boundary.max_score}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {boundary.remarks || '--'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Sidebar / Options */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-500" />
              System Info
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</Label>
                <p className="text-sm text-gray-900">
                  {system.description || <span className="italic text-gray-400">No description provided.</span>}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Level</Label>
                <p className="text-sm text-gray-900">
                  {system.level || 'O-Level'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                  <p className="text-xs text-gray-500">Is system currently active?</p>
                </div>
                {system.is_active ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
    </ProtectedComponent>
  );
}
