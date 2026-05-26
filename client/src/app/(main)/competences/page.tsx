'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  BookOpen,
  LayoutGrid
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
import { FetchCompetencyAreas, DeleteCompetencyArea } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';

import { Icon } from '@iconify/react';
import { ICompetencyAreaListResponse } from '@/features/exam/exam.schemas';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function CompetencyAreasListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useSelector((state: RootState) => state.auth);
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchCompetencyAreas(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this competency area?")) {
      const res = await DeleteCompetencyArea(id);
      if (res.success) {
        toast.success("Competency area deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete competency area");
      }
    }
  };

  const columns: ColumnDef<ICompetencyAreaListResponse>[] = [
    {
      key: "name",
      header: "Competency Area Name",
      cell: (area) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{area.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class_name",
      header: "Class",
      cell: (area) => (
        <span className="font-medium text-gray-600">{area.class_name || 'N/A'}</span>
      ),
    },
    {
      key: "term_name",
      header: "Term",
      cell: (area) => (
        <span className="font-medium text-gray-600">{area.term_name || 'N/A'}</span>
      ),
    },
    {
      key: "topic_name",
      header: "Topic / Competency",
      cell: (area) => (
        <span className="font-medium text-gray-600">{area.topic_name || 'N/A'}</span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (area) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/competences/${area.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(area.id)}
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
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_COMPETENCES}>
    <MainLayout
      title="Competency Areas"
      description="Broader categories for assessment topics."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "New Area",
            icon: <Plus className="w-4 h-4" />,
            href: "/competences/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search areas..." 
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
                <LayoutGrid className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No competency areas found</p>
                <p className="text-sm">Create areas to categorize your integration activities.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
