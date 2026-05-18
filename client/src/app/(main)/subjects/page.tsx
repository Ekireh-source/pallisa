'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  BookMarked
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
import { FetchSubjects, DeleteSubject } from '@/features/members/members.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';

export default function SubjectsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = (query?: any) => {
    return FetchSubjects(query);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      const res = await DeleteSubject(id);
      if (res.success) {
        toast.success("Subject deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete subject");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Subject Name",
      cell: (subject) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{subject.name}</p>
            <p className="text-xs text-gray-400">Code: {subject.code || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (subject) => (
        <span className="font-medium text-gray-600">{subject.department || 'General'}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (subject) => (
        subject.active ? (
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
      cell: (subject) => (
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
                onClick={() => router.push(`/subjects/${subject.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View detail
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/subjects/${subject.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(subject.id)}
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
      title="Subjects"
      description="Manage the school curriculum and course offerings."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
          <Link href="/subjects/create">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search subjects..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-emerald-500 w-full"
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
                <BookMarked className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No subjects found</p>
                <p className="text-sm">Start adding subjects to your curriculum.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
