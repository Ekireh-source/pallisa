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
import { MainLayout } from '@/components/layout/main-layout';

export default function AcademicYearsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = (query?: any) => {
    return FetchAcademicYears(query);
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

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Academic Year",
      cell: (year) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{year.name}</p>
            <p className="text-xs text-gray-400">Created: {format(new Date(year.created_at), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      ),
    },
    {
      key: "start_date",
      header: "Duration",
      cell: (year) => (
        <div className="text-gray-600 flex items-center gap-2 text-sm font-medium">
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
      cell: (year) => (
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
                onClick={() => router.push(`/academic-years/${year.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
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
        <Button className="rounded-xl lg:justify-end h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
          <Link href="/academic-years/create">
            <Plus className="w-4 h-4 mr-2" />
            New Academic Year
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search years..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-indigo-500 w-full"
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
