'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  CalendarDays,
  Clock,
  CheckCircle2
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
import { FetchAcademicYears, DeleteAcademicYear } from '@/features/members/members.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { IAcademicYearListResponse } from '@/features/members/members.schemas';
import { MainLayout } from '@/components/layout/main-layout';

export default function AcademicYearsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchAcademicYears(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this academic year?")) {
      const res = await DeleteAcademicYear(id);
      if (res.success) {
        toast.success("Academic year deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete academic year");
      }
    }
  };

  const columns: ColumnDef<IAcademicYearListResponse>[] = [
    {
      key: "name",
      header: "Academic Year",
      cell: (year) => (
        <div className="font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-bold text-sm sm:text-base truncate">{year.name}</p>
            <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 space-y-0.5">
              <p className="sm:hidden text-gray-600 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">{format(new Date(year.start_date), 'MMM yy')} - {format(new Date(year.end_date), 'MMM yy')}</span>
              </p>
              <p className="font-medium">Created: {format(new Date(year.created_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "start_date",
      header: "Duration",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (year) => (
        <div className="text-gray-600 flex items-center gap-2 text-sm font-semibold">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{format(new Date(year.start_date), 'MMM yyyy')} - {format(new Date(year.end_date), 'MMM yyyy')}</span>
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (year) => (
        year.active ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-2 sm:px-3 py-0.5 sm:py-1 flex items-center gap-1 w-fit rounded-full text-[10px] sm:text-xs">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
            <span>Active</span>
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
      cell: (year) => (
        <div className="text-right pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-50 rounded-xl">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-sm"
                onClick={() => router.push(`/academic-years/${year.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-sm text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(year.id)}
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
    <MainLayout
      title="Academic Years"
      description="Manage the school's academic calendar and cycles."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-4 sm:px-6 shadow-sm border border-transparent w-full sm:w-auto" asChild>
          <Link href="/academic-years/create">
            <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
            <span className="hidden sm:inline">New Academic Year</span>
            <span className="sm:hidden">New Year</span>
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search years..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-2 sm:p-4">
          <PaginatedTable
            fetchFirstPage={fetchFirstPage}
            fetchFromUrl={getPaginatedFromUrl}
            columns={columns}
            showRowNumbers={false}
            skeletonRows={5}
            className="min-h-0!"
            tableClassName="[&_td]:py-3 [&_td]:px-2 [&_th]:px-2"
            query={{ search: searchTerm }}
            deps={[searchTerm]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <CalendarDays className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No academic years found</p>
                <p className="text-sm">Create an academic year to start your calendar.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
