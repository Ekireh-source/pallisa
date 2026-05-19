'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  BookOpen,
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
import { FetchTopics, DeleteTopic } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { ITopicListResponse } from '@/features/exam/exam.schemas';
import { MainLayout } from '@/components/layout/main-layout';

export default function TopicsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchTopics(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res;
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this topic?")) {
      const res = await DeleteTopic(id);
      if (res.success) {
        toast.success("Topic deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete topic");
      }
    }
  };

  const columns: ColumnDef<ITopicListResponse>[] = [
    {
      key: "name",
      header: "Topic Name",
      cell: (topic) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{topic.name}</p>
            <p className="text-xs text-gray-400">Class: {topic.class_name || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subject_name",
      header: "Subject",
      cell: (topic) => (
        <span className="font-medium text-gray-600">{topic.subject_name || 'N/A'}</span>
      ),
    },
    {
      key: "competence_name",
      header: "Competency Area",
      cell: (topic) => (
        <span className="text-sm text-gray-500 font-medium">{topic.competence_name || 'N/A'}</span>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (topic) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2 font-medium"
                onClick={() => router.push(`/topics/${topic.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/topics/${topic.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(topic.id)}
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
      title="Academic Topics"
      description="Manage competencies and learning outcomes across subjects."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
          <Link href="/topics/create">
            <Plus className="w-4 h-4 mr-2" />
            Add Topic
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search topics..." 
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
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <BookMarked className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No topics found</p>
                <p className="text-sm">Try adjusting your search or add a new topic.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
