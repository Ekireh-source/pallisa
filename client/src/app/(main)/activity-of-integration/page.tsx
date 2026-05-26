'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  Zap
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { FetchActivities, DeleteActivity } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { getPaginatedFromUrl } from '@/lib/utils';
import { IActivityListResponse } from '@/features/exam/exam.schemas';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function ActivitiesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useSelector((state: RootState) => state.auth);
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchActivities(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      const res = await DeleteActivity(id);
      if (res.success) {
        toast.success("Activity deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete activity");
      }
    }
  };

  const columns: ColumnDef<IActivityListResponse>[] = [
    {
      key: "name",
      header: "Activity Details",
      cell: (act) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{act?.competency_area_name}</p>
            
          </div>
        </div>
      ),
    },
    {
      key: "subject_name",
      header: "Subject",
      cell: (act) => (
        <span className="font-medium text-gray-600">{act.subject_name || 'N/A'}</span>
      ),
    },
    {
      key: "topic_name",
      header: "Academic Topic",
      cell: (act) => (
        <span className="text-sm text-gray-500 font-medium">{act.topic_name || 'N/A'}</span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (act) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl  border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2 font-medium"
                onClick={() => router.push(`/activity-of-integration/${act.public_id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/activity-of-integration/${act.public_id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(act.public_id)}
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
      title="Activities of Integration"
      description="Manage assessment tasks for the competency-based curriculum."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "New Activity",
            icon: <Plus className="w-4 h-4" />,
            href: "/activity-of-integration/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search activities..." 
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
                <Zap className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm">Create activities to start assessing students.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
