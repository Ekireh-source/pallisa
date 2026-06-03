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
import { ICampusListResponse } from '@/features/school/school.schemas';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function CampusesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useSelector((state: RootState) => state.auth);

  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = async (query?: any) => {
    const res = await FetchCampuses(query);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res as any;
  };

  const handleDelete = async (id: string) => {
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

  const columns: ColumnDef<ICampusListResponse>[] = [
    {
      key: "name",
      header: "Campus Name",
      cell: (campus) => (
        <div className="font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-My-Black font-bold text-sm sm:text-base truncate">{campus.name}</p>
            <div className="text-[11px] sm:text-xs text-My-Black mt-0.5 space-y-0.5">
              <p className="sm:hidden font-semibold text-My-Black truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-My-Black shrink-0" />
                <span>{campus.address || 'No Location'}</span>
              </p>
              {campus.phone_number && (
                <p className="sm:hidden font-semibold text-My-Black flex items-center gap-1">
                  <Phone className="w-3 h-3 text-My-Black shrink-0" />
                  <span>{campus.phone_number}</span>
                </p>
              )}
              <p className="font-medium">Created: {campus.created_at ? new Date(campus.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Location",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (campus) => (
        <div className="flex items-center text-sm text-My-Black gap-1 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-My-Black" />
          <span>{campus.address || 'No Location'}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      className: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      cell: (campus) => (
        <div className="text-xs text-My-Black space-y-1 font-semibold">
          {campus.phone_number && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-My-Black" />
              <span>{campus.phone_number}</span>
            </div>
          )}
          {campus.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-My-Black" />
              <span className="text-My-Black">{campus.email}</span>
            </div>
          )}
          {!campus.phone_number && !campus.email && <span className="text-My-Black">--</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (campus) => (
        campus.active ? (
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
      cell: (campus) => (
        <div className="text-right pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-50 rounded-xl">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-My-Black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl -xl border-gray-100">
              <DropdownMenuItem
                className="cursor-pointer py-2 font-medium text-sm"
                onClick={() => router.push(`/campuses/${campus.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-sm"
                onClick={() => router.push(`/campuses/${campus.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600 text-sm"
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
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_CAMPUSES}>
      <MainLayout
        title="School Campuses"
        description="Manage school campuses and branches."
        headerActions={
          <ResponsiveHeaderActions
            primary={{
              label: "Add Campus",
              icon: <Plus className="w-4 h-4" />,
              href: "/campuses/create",
            }}
          />
        }
      >
        <Card className="border-none -none ring-0">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
              <Input
                placeholder="Search campuses..."
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
              deps={[searchTerm, school]}
              refreshRef={tableRefreshRef}
              emptyState={
                <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                  <Building2 className="w-12 h-12 text-My-Black mb-4" />
                  <p className="text-lg font-medium">No campuses found</p>
                  <p className="text-sm">Add your first campus to get started.</p>
                </div>
              }
            />
          </div>
        </Card>
      </MainLayout>
    </ProtectedComponent>
  );
}
