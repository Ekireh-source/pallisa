'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  MapPin,
  Phone,
  Mail,
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
} from '@/components/ui';
import { FetchCampuses, DeleteCampus } from '@/features/school/school.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';

export default function CampusesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = (query?: any) => {
    return FetchCampuses(query);
  };

  const fetchFromUrl = (url: string, query?: any) => {
    return getPaginatedFromUrl(url, query);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this campus?")) {
      const res = await DeleteCampus(id);
      if (res.success) {
        toast.success("Campus deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete campus");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Campus Name",
      cell: (campus) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{campus.name}</p>
            <p className="text-xs text-gray-400">Created: {campus.created_at ? new Date(campus.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Location",
      cell: (campus) => (
        <div className="flex items-center text-sm text-gray-600 gap-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span>{campus.address || 'No Location'}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (campus) => (
        <div className="text-xs text-gray-600 space-y-1">
          {campus.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span>{campus.phone_number}</span>
            </div>
          )}
          {campus.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">{campus.email}</span>
            </div>
          )}
          {!campus.phone_number && !campus.email && <span className="text-gray-400">--</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (campus) => (
        campus.active ? (
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
      cell: (campus) => (
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
                onClick={() => router.push(`/campuses/${campus.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/campuses/${campus.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(campus.id)}
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
      title="School Campuses"
      description="Manage school campuses and branches."
      headerActions={
        <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
          <Link href="/campuses/create">
            <Plus className="w-4 h-4 mr-2" />
            Add Campus
          </Link>
        </Button>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search campuses..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4">
          <PaginatedTable
            fetchFirstPage={fetchFirstPage}
            fetchFromUrl={fetchFromUrl}
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
                <Building2 className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No campuses found</p>
                <p className="text-sm">Add your first campus to get started.</p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
