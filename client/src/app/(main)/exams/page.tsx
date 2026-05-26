'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  Eye
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
import { FetchExams, DeleteExam } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';

import { IExamListResponse } from '@/features/exam/exam.schemas';

import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function ExamsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useSelector((state: RootState) => state.auth);
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchExams(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      const res = await DeleteExam(id);
      if (res.success) {
        toast.success("Exam deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete exam");
      }
    }
  };

  const columns: ColumnDef<IExamListResponse>[] = [
    {
      key: "name",
      header: "Exam Details",
      cell: (exam) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{exam.name}</p>
            <p className="text-xs text-gray-400">Term: {exam.term_name || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "academic_year_name",
      header: "Academic Year",
      cell: (exam) => (
        <span className="font-medium text-gray-600">{exam.class_obj || 'N/A'}</span>
      ),
    },
    {
      key: "dates",
      header: "Assessment Period",
      cell: (exam) => (
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{format(new Date(exam.start_date), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>End: {format(new Date(exam.end_date), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (exam) => (
        exam.is_published ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-3 py-1 flex items-center gap-1 w-fit rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none px-3 py-1 rounded-full font-bold w-fit">
            Inactive
          </Badge>
        )
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (exam) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2 font-medium"
                onClick={() => router.push(`/exams/${exam.public_id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/exams/${exam.public_id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(exam.public_id)}
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-2" />
                Delete
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
      title="Examinations"
      description="Schedule and manage school-wide assessments."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "New Exam",
            icon: <Plus className="w-4 h-4" />,
            href: "/exams/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search exams..." 
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
            query={{ search: searchTerm, school: school?.id }}
            deps={[searchTerm, school]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <ClipboardCheck className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No exams scheduled</p>
                <p className="text-sm">Create a new exam to begin assessments.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
