'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Layers,
  Users,
  Building2
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { FetchClasses, DeleteClass } from '@/features/members/members.service';
import CampusSearchableSelect from '@/components/selects/campussearchableselect';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { IClassListResponse } from '@/features/members/members.schemas';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function ClassesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const router = useRouter();

  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const params = { ...query };
    if (params.level === 'all') delete params.level;
    if (params.campus === 'all') delete params.campus;
    const res = await FetchClasses(params);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      const res = await DeleteClass(id);
      if (res.success) {
        toast.success("Class deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete class");
      }
    }
  };

  const columns: ColumnDef<IClassListResponse>[] = [
    {
      key: "name",
      header: "Class Name",
      cell: (cls) => (
        <div className="font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-bold text-sm sm:text-base truncate">{cls.name}</p>
            <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 space-y-0.5">
              <p className="sm:hidden font-semibold text-gray-600 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary shrink-0" />
                <span>{cls.campus_name || 'Main Campus'}</span>
              </p>
              <p className="sm:hidden font-semibold text-gray-600 flex items-center gap-1">
                <Layers className="w-3 h-3 text-primary shrink-0" />
                <span>{cls.sections_count || 0} Streams</span>
              </p>
              <p className="font-semibold text-primary">Level: {cls.level === '0level' ? 'O-Level' : 'A-Level'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "campus_name",
      header: "Campus",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (cls) => (
        <div className="flex items-center text-sm text-gray-600 gap-1.5 font-semibold">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span>{cls.campus_name || 'Main Campus'}</span>
        </div>
      ),
    },
    {
      key: "sections_count",
      header: "Streams",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (cls) => (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none px-3 font-bold rounded-full text-xs">
          {cls.sections_count || 0} Streams
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (cls) => (
        cls.active ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full w-fit text-[10px] sm:text-xs">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold w-fit text-[10px] sm:text-xs">
            Inactive
          </Badge>
        )
      ),
    },
    {
      key: "actions",
      header: <div className="text-right pr-2">Actions</div>,
      cell: (cls) => (
        <div className="text-right pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-50 rounded-xl">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem
                className="cursor-pointer py-2 text-sm"
                onClick={() => router.push(`/classes/${cls.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-sm"
                onClick={() => router.push(`/classes/${cls.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-sm text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(cls.id)}
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
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_CLASSES}>
    <MainLayout
      title="Classes"
      description="Manage grade levels and student groups."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "Add Class",
            icon: <Plus className="w-4 h-4" />,
            href: "/classes/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes..."
                className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-primary w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="h-10 rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="0level">O-Level</SelectItem>
                  <SelectItem value="Alevel">A-Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <CampusSearchableSelect
                value={selectedCampus}
                onValueChange={setSelectedCampus}
                placeholder="All Campuses"
                triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
              />
            </div>
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
            query={{ search: searchTerm, level: selectedLevel, campus: selectedCampus }}
            deps={[searchTerm, selectedLevel, selectedCampus]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <Layers className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No classes defined</p>
                <p className="text-sm">Start by adding grade levels (e.g., Primary 1, Senior 1).</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
