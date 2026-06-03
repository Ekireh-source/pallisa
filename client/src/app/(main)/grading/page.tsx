'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Layers,
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
import { FetchGradingSystems, DeleteGradingSystem } from '@/features/reports/reports.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';

import { IGradingSystemListResponse } from '@/features/reports/reports.schemas';

import { Icon } from '@iconify/react';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';

export default function GradingSystemsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useAppSelector((state) => state.auth);

  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchGradingSystems(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this grading system?")) {
      const res = await DeleteGradingSystem(id);
      if (res.success) {
        toast.success("Grading system deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete grading system");
      }
    }
  };

  const columns: ColumnDef<IGradingSystemListResponse>[] = [
    {
      key: "name",
      header: "System Name",
      cell: (system) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-My-Black font-semibold">{system.name}</p>
            <p className="text-xs text-My-Black">Level: {(system as any).level || 'O-Level'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Level",
      cell: (system) => (
        <Badge variant="outline" className="rounded-lg capitalize font-medium border-gray-200 bg-gray-50 text-My-Black px-3 py-1">
          {system.level}
        </Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (system) => (
        system.is_active ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-3 py-1 rounded-full w-fit">
            Active
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
      cell: (system) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-My-Black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl -xl border-gray-100">
              <DropdownMenuItem
                className="cursor-pointer py-2 font-medium"
                onClick={() => router.push(`/grading/${system.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Scales
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => router.push(`/grading/${system.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit System
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(system.id)}
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
        title="Grading Systems"
        description="Manage grading scales and boundaries for student report cards."
        headerActions={
          <ResponsiveHeaderActions
            primary={{
              label: "New Grading System",
              icon: <Plus className="w-4 h-4" />,
              href: "/grading/create",
            }}
          />
        }
      >
        <Card className="border-none -none ring-0">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
              <Input
                placeholder="Search grading systems..."
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
              deps={[searchTerm, school?.id]}
              refreshRef={tableRefreshRef}
              emptyState={
                <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                  <Layers className="w-12 h-12 text-My-Black mb-4" />
                  <p className="text-lg font-medium">No grading systems found</p>
                  <p className="text-sm">Create a grading system to define score boundaries.</p>
                </div>
              }
            />
          </div>
        </Card>
      </MainLayout>
    </ProtectedComponent>
  );
}
