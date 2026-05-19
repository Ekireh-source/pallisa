'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  Award,
  BookOpen,
  Calendar
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
import { FetchProjectsList, DeleteProject } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { getPaginatedFromUrl } from '@/lib/utils';
interface IProjectMatrixListResponse {
  public_id: string;
  subject_name: string;
  stream_name: string;
  competency_number: number;
  term_name: string;
  academic_year_name: string;
}

import { MainLayout } from '@/components/layout/main-layout';

export default function ProjectsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchProjectsList(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project competency matrix scores? This will remove all graded marks for this stream and subject.")) {
      const res = await DeleteProject(id);
      if (res.success) {
        toast.success("Project Matrix deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete project matrix");
      }
    }
  };

  const columns: ColumnDef<IProjectMatrixListResponse>[] = [
    {
      key: "subject_name",
      header: "Subject & Stream",
      cell: (project) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-gray-900 font-bold">{project.subject_name || 'N/A'}</p>
            <p className="text-xs text-gray-400 font-medium">Stream: {project.stream_name || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "competency_number",
      header: "Competency Area",
      cell: (project) => (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none font-bold rounded-full px-3 py-1 flex items-center gap-1 w-fit">
          <Award className="w-3.5 h-3.5" />
          <span>Competency {project.competency_number} (C{project.competency_number})</span>
        </Badge>
      ),
    },
    {
      key: "term_name",
      header: "Academic Period",
      cell: (project) => (
        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{project.term_name || 'N/A'} ({project.academic_year_name || 'Active Year'})</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (project) => (
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
                onClick={() => router.push(`/competences/projects/${project.public_id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2 text-primary" />
                View & Grade Marks
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 rounded-lg font-semibold text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onClick={() => handleDelete(project.public_id)}
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-2" />
                Delete Matrix
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <MainLayout
      title="Project Competency Matrices"
      description="List of all unique graded project competency matrices. Configure new matrices or update graded student marks."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-50 font-bold px-5 border border-gray-200 shadow-sm w-full sm:w-auto" asChild>
          <Link href="/competences/projects/create">
            <Plus className="w-4 h-4 mr-2" />
            New Project Matrix
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0 bg-transparent">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search subjects or streams..." 
              className="pl-11 h-11 rounded-xl border-gray-200 bg-white focus:ring-primary w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="p-4 border-none shadow-sm ring-1 ring-gray-100">
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
              <div className="flex flex-col items-center justify-center text-gray-500 py-16">
                <Award className="w-14 h-14 text-gray-200 mb-4" />
                <p className="text-lg font-bold text-gray-900">No project matrices found</p>
                <p className="text-sm mt-1 text-gray-400">Initialize a new project matrix to start grading student competency criteria.</p>
                <Button className="rounded-xl mt-4 bg-primary hover:bg-primary/90 text-white font-semibold" asChild>
                  <Link href="/competences/projects/create">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project Matrix
                  </Link>
                </Button>
              </div>
            }
          />
        </Card>
      </Card>
    </MainLayout>
  );
}
