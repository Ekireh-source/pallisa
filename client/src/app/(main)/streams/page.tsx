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
  Users
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
import { FetchStreams, DeleteStream } from '@/features/members/members.service';
import { IStreamListResponse } from '@/features/members/members.schemas';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';

export default function StreamsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchStreams(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this stream?")) {
      const res = await DeleteStream(id);
      if (res.success) {
        toast.success("Stream deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete stream");
      }
    }
  };

  const columns: ColumnDef<IStreamListResponse>[] = [
    {
      key: "name",
      header: "Stream Name",
      cell: (stream) => (
        <div className="font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-bold text-sm sm:text-base truncate">{stream.name}</p>
            <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 space-y-0.5">
              <p className="font-semibold text-primary truncate">Class: {stream.class_obj_name || 'N/A'}</p>
              <p className="sm:hidden font-semibold text-gray-600 flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{stream.capacity || 'Not Specified'} Students</span>
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (stream) => (
        <div className="flex items-center text-sm text-gray-600 gap-1.5 font-semibold">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>{stream.capacity || 'Not Specified'} Students</span>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (stream) => (
        stream.is_active ? (
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
      cell: (stream) => (
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
                onClick={() => router.push(`/streams/${stream.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-sm"
                onClick={() => router.push(`/streams/${stream.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-sm text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(stream.id)}
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
      title="Streams"
      description="Manage class divisions and student distributions."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-4 sm:px-6 shadow-sm border border-transparent w-full sm:w-auto" asChild>
          <Link href="/streams/create">
            <Plus className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
            <span>New Stream</span>
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search streams..." 
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
                <Layers className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No streams found</p>
                <p className="text-sm">Create a stream to assign it to a class.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
