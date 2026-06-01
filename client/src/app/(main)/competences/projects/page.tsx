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
  name: string;
  subject_name: string;
  stream_name: string;
  term_name: string;
  academic_year_name: string;
}

import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function ProjectsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchProjectsList(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project and all its graded competency scores? This action cannot be undone.")) {
      const res = await DeleteProject(id);
      if (res.success) {
        toast.success("Project evaluation matrix deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete project matrix");
      }
    }
  };

  const columns: ColumnDef<IProjectMatrixListResponse>[] = [
    {
      key: "name",
      header: "Project Details",
      cell: (project) => (
        <div className="font-bold flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm border border-indigo-100/50">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-900 font-extrabold text-base leading-tight">{project.name || 'Untitled Project'}</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Subject: <span className="text-gray-800 font-bold">{project.subject_name || 'N/A'}</span> | Stream: <span className="text-gray-800 font-bold">{project.stream_name || 'N/A'}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "term_name",
      header: "Academic Period",
      cell: (project) => (
        <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{project.term_name || 'N/A'} ({project.academic_year_name || 'Active Year'})</span>
        </div>
      ),
    },
    {
      key: "grading_progress",
      header: "Grading Progress",
      cell: (project) => {
        const progress = (project as any).grading_progress ?? 0;
        const isComplete = progress === 100;
        return (
          <div className="w-44">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                isComplete ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded' : 'text-gray-400'
              }`}>
                {isComplete ? 'Fully Graded' : 'Grading...'}
              </span>
              <span className={`text-xs font-extrabold ${
                isComplete ? 'text-emerald-600' : 'text-gray-600'
              }`}>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner border border-gray-200/50">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
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
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_COMPETENCES}>
    <MainLayout
      title="Project Competency Matrices"
      description="List of all unique graded project competency matrices. Configure new matrices or update graded student marks."
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: "New Project Matrix",
            icon: <Plus className="w-4 h-4" />,
            href: "/competences/projects/create",
          }}
        />
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search subjects or streams..." 
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
        </div>
      </Card>
    </MainLayout>
    </ProtectedComponent>
  );
}
