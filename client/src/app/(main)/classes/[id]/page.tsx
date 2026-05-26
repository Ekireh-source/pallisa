'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  ArrowLeft,
  Building2,
  Layers,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { toast } from 'sonner';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { FetchClassById, FetchStreams, DeleteStream } from '@/features/members/members.service';
import { getPaginatedFromUrl } from '@/lib/utils';
import { IStreamListResponse } from '@/features/members/members.schemas';
import Link from 'next/link';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const tableRefreshRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      loadClassDetails();
    }
  }, [id]);

  const loadClassDetails = async () => {
    setLoading(true);
    const res = await FetchClassById(id);
    if (res.success) {
      setClassDetails(res.data);
    } else {
      toast.error('Failed to load class details');
    }
    setLoading(false);
  };

  const fetchFirstPage = (query?: any) => {
    const enhancedQuery = {
      ...query,
      class_id: id,
      search: searchTerm,
    };
    return FetchStreams(enhancedQuery);
  };

  const handleDeleteStream = async (streamId: number) => {
    if (confirm("Are you sure you want to delete this stream?")) {
      const res = await DeleteStream(streamId);
      if (res.success) {
        toast.success("Stream deleted successfully");
        tableRefreshRef.current?.refresh();
        loadClassDetails(); // Refresh stats
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
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{stream.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (stream) => (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-none px-3 font-semibold rounded-full">
          {stream.capacity} Students
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (stream) => (
        stream.is_active && stream.is_active ? (
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
      cell: (stream) => (
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
                onClick={() => router.push(`/streams/${stream.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDeleteStream(stream.id)}
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

  if (loading) {
    return (
      <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_CLASSES}>
    <MainLayout title="Class Details" description="Loading...">
        <div className="flex justify-center items-center h-64">
          <Icon icon="hugeicons:loading-01" className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    </ProtectedComponent>
    );
  }

  if (!classDetails) {
    return (
      <MainLayout title="Class Details" description="Class not found">
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-gray-500 mb-4">The class you are looking for does not exist.</p>
          <Button onClick={() => router.push('/classes')}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={classDetails.name}
      description={`Manage details and streams for ${classDetails.name}.`}
      stats={[
        {
          icon: 'hugeicons:layers-01',
          label: 'Class Level',
          value: classDetails.level === '0level' ? 'O-Level' : 'A-Level'
        },
        {
          icon: 'hugeicons:building-03',
          label: 'Campus',
          value: classDetails.campus_name || 'Main Campus'
        },
        {
          icon: 'hugeicons:user-group',
          label: 'Streams',
          value: String(classDetails.sections_count || 0)
        }
      ]}
      headerActions={
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-4 border-gray-200"
            onClick={() => router.push('/classes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Button>
          <Button 
            className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent"
            onClick={() => router.push(`/classes/${id}/edit`)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Class
          </Button>
        </div>
      }
    >
      <Card className="border-none shadow-none ring-1 ring-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Streams</h3>
            <p className="text-sm text-gray-500">Manage all streams under this class</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search streams..."
                className="pl-10 h-10 rounded-xl border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-10 rounded-xl shrink-0" asChild>
              <Link href={`/streams/create?class_id=${id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Stream
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="p-0 bg-white">
          <PaginatedTable
            fetchFirstPage={fetchFirstPage}
            fetchFromUrl={getPaginatedFromUrl}
            columns={columns}
            showRowNumbers={false}
            skeletonRows={3}
            className="min-h-0!"
            tableClassName="[&_td]:py-4"
            deps={[searchTerm, id]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <Layers className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No streams found</p>
                <p className="text-sm text-center max-w-sm mt-1">
                  There are no streams associated with this class yet. Click "Add Stream" to create one.
                </p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
