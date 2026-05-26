'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { FetchSaAssessments, DeleteSaAssessment } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { getPaginatedFromUrl } from '@/lib/utils';
interface ISaAssessmentListResponse {
  public_id: string;
  subject_name: string;
  stream_name: string;
  term_name: string;
  academic_year_name: string;
  total_box: string | number;
  teacher_name: string;
}

import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function SaAssessmentsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchSaAssessments(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this summative assessment configuration?")) {
      const res = await DeleteSaAssessment(id);
      if (res.success) {
        toast.success("Summative Assessment deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete assessment");
      }
    }
  };

  const columns: ColumnDef<ISaAssessmentListResponse>[] = [
    {
      key: "subject_name",
      header: "Subject Details",
      cell: (sa) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-gray-900 font-bold">{sa.subject_name || 'N/A'}</p>
            <p className="text-xs text-gray-400 font-medium">Stream: {sa.stream_name || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "term_name",
      header: "Academic Period",
      cell: (sa) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700 text-sm">{sa.term_name || 'N/A'}</span>
          <span className="text-xs text-gray-400">Year: {sa.academic_year_name || 'Active Year'}</span>
        </div>
      ),
    },
    {
      key: "total_box",
      header: "Total Box Factor",
      cell: (sa) => (
        <div className="flex items-center gap-1.5 font-bold text-gray-900">
          <Percent className="w-4 h-4 text-emerald-500" />
          <span>{parseFloat(sa.total_box).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: "teacher_name",
      header: "Assigned Teacher",
      cell: (sa) => (
        <span className="text-sm font-medium text-gray-500">{sa.teacher_name || 'System Auto'}</span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (sa) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-50">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border border-gray-100 shadow-xl p-1.5">
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-lg font-semibold text-gray-700"
                onClick={() => router.push(`/exams/sa-assessment/${sa.public_id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2 text-primary" />
                View & Grade Marks
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-lg font-semibold text-gray-700"
                onClick={() => router.push(`/exams/sa-assessment/${sa.public_id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2 text-primary" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-lg font-semibold text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onClick={() => handleDelete(sa.public_id)}
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-2" />
                Delete Config
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_GRADING}>
    <MainLayout
      title="Summative Assessment configurations"
      description="Define exam milestones scaling configurations and assign student marks matrices."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "New SA Assessment",
            icon: <Plus className="w-4 h-4" />,
            href: "/exams/sa-assessment/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search assessment subjects..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4">
          <PaginatedTable
            fetchFirstPage={fetchFirstPage}
            fetchFromUrl={getPaginatedFromUrl}
            columns={columns}
            showRowNumbers={false}
            skeletonRows={5}
            className="min-h-0!"
            tableClassName="[&_td]:py-4"
            query={{ search: searchTerm }}
            deps={[searchTerm]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <TrendingUp className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No SA configurations found</p>
                <p className="text-sm">Configure new Summative Assessments to start recording student grades.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
