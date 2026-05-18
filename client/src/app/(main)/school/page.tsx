'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Building2,
  Eye,
  MapPin,
  Phone,
  Mail
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
import { FetchSchools, DeleteSchool } from '@/features/school/school.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatImgUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}

export default function SchoolsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const router = useRouter();
  
  const tableRefreshRef = useRef<(() => void) | null>(null);

  const fetchFirstPage = async (query?: any) => {
    const params: any = {
      search: query?.search || undefined,
    };
    if (query?.level && query.level !== 'all') {
      params.level = query.level;
    }
    const result = await FetchSchools(params);
    
    return result;
  };

  const fetchFromUrl = async ({ url }: { url: string }) => {
    const res = await api.get(url);
    return res.data;
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this school?")) {
      const result = await DeleteSchool(id);
      if (result.success) {
        toast.success("School deleted successfully");
        tableRefreshRef.current?.();
      } else {
        toast.error("Failed to delete school");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "School Name",
      cell: (school) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            {school.logo
              ? <img src={formatImgUrl(school.logo) || ''} alt="" className="w-4 h-4 object-contain" />
              : <Building2 className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <Link href={`/school/${school.id}`} className="hover:text-indigo-600 hover:underline font-semibold text-gray-900 transition-colors">
              {school.name}
            </Link>
            <span className="text-xs text-gray-400 font-normal">
              ID: {school.public_id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Level",
      cell: (school) => (
        school.level ? (
          <Badge 
            variant="secondary"
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border-none ${
              school.level === 'primary' 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-50/85' 
                : school.level === 'secondary'
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50/85'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-50/85'
            }`}
          >
            {school.level}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (school) => (
        <div className="flex flex-col gap-1">
          {school.email && (
            <div className="flex items-center text-xs text-gray-500">
              <Mail className="w-3 h-3 mr-1" /> {school.email}
            </div>
          )}
          {school.phone_number && (
            <div className="flex items-center text-xs text-gray-500">
              <Phone className="w-3 h-3 mr-1" /> {school.phone_number}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      cell: (school) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
          {school.address || "Not specified"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (school) => (
        <Badge 
          variant={school.active ? 'default' : 'destructive'}
          className={`rounded-full px-2.5 py-0.5 border-none ${
            school.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''
          }`}
        >
          {school.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (school) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem className="cursor-pointer py-2" onClick={() => router.push(`/school/${school.id}`)}
              >
                <Eye className="w-4 h-4 mr-2 text-indigo-500" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2" onClick={() => router.push(`/school/${school.id}/edit`)}>
                <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                Edit School
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2 text-rose-600 focus:text-rose-600" onClick={() => handleDelete(school.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete School
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-500 mt-1">Manage registered schools and institutions.</p>
        </div>
        <Button className="shadow-lg shadow-blue-200 rounded-xl h-11" asChild>
          <Link href="/school/create">
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search schools..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px] h-10 rounded-lg border-gray-200">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-gray-100">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="tertiary">Tertiary</SelectItem>
              </SelectContent>
            </Select>
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
            query={{ search: searchTerm, level: selectedLevel }}
            deps={[searchTerm, selectedLevel]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <Building2 className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No schools found</p>
                <p className="text-sm">Add your first school to get started.</p>
              </div>
            }
          />
        </div>
      </Card>
    </div>
  );
}

