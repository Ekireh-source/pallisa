'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  ArrowLeft,
  Users,
  Layers,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { toast } from 'sonner';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { FetchStreamById, FetchStudents, DeleteStudent } from '@/features/members/members.service';
import { getPaginatedFromUrl } from '@/lib/utils';

import { IStudent } from '@/features/members/members.schemas';

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [streamDetails, setStreamDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const tableRefreshRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      loadStreamDetails();
    }
  }, [id]);

  const loadStreamDetails = async () => {
    setLoading(true);
    const res = await FetchStreamById(id);
    if (res && 'data' in res) {
      setStreamDetails(res.data);
    } else {
      toast.error('Failed to load stream details');
    }
    setLoading(false);
  };

  const fetchFirstPage = async (query?: any) => {
    const enhancedQuery = {
      ...query,
      stream_id: id,
      search: searchTerm,
    };
    const res = await FetchStudents(enhancedQuery);
    if (res && 'error' in res) {
      throw res.error;
    }
    return res;
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      const res = await DeleteStudent(studentId);
      if (res.success) {
        toast.success("Student deleted successfully");
        tableRefreshRef.current?.refresh();
        loadStreamDetails(); // Refresh stats
      } else {
        toast.error("Failed to delete student");
      }
    }
  };

  const columns: ColumnDef<IStudent>[] = [
    {
      key: "user_first_name",
      header: "Student Name",
      cell: (student) => {
        const initials = `${student.user_first_name?.[0] || ''}${student.user_last_name?.[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
              <AvatarImage src={student.user_profile_data?.profile_picture} alt={initials} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{student.user_first_name} {student.user_last_name}</p>
              <p className="text-xs text-gray-500">{student.student_id || 'No ID'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "gender",
      header: "Gender",
      cell: (student) => (
        <span className="text-gray-600 font-medium">
          {student.user_gender === 'M' ? 'Male' : student.user_gender === 'F' ? 'Female' : 'Other'}
        </span>
      ),
    },
    {
      key: "enrollment",
      header: "Status",
      cell: (student) => {
        const statusColors: Record<string, string> = {
          enrolled: "bg-emerald-50 text-emerald-700",
          graduated: "bg-blue-50 text-blue-700",
          suspended: "bg-rose-50 text-rose-700",
          transferred: "bg-amber-50 text-amber-700",
          withdrawn: "bg-gray-100 text-gray-700",
        };
        const colorClass = statusColors[student.enrollment_status] || statusColors.enrolled;
        
        return (
          <Badge className={`border-none px-3 font-semibold rounded-full ${colorClass}`}>
            {student.enrollment_status.charAt(0).toUpperCase() + student.enrollment_status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (student) => (
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
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => router.push(`/students/${student.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDeleteStudent(student.id)}
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
      <MainLayout title="Stream Details" description="Loading...">
        <div className="flex justify-center items-center h-64">
          <Icon icon="hugeicons:loading-01" className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!streamDetails) {
    return (
      <MainLayout title="Stream Details" description="Stream not found">
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-gray-500 mb-4">The stream you are looking for does not exist.</p>
          <Button onClick={() => router.push('/streams')}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${streamDetails.class_obj_name || 'Class'} - ${streamDetails.name}`}
      description={`Manage details and students for ${streamDetails.name}.`}
      stats={[
        {
          icon: 'hugeicons:layers-01',
          label: 'Class Level',
          value: streamDetails.class_obj_name || 'N/A'
        },
        {
          icon: 'hugeicons:user-group',
          label: 'Capacity',
          value: `${streamDetails.current_enrollment || 0} / ${streamDetails.capacity}`
        },
        {
          icon: 'hugeicons:checkmark-circle-01',
          label: 'Status',
          value: streamDetails.is_active ? 'Active' : 'Inactive',
          isPositive: streamDetails.is_active
        }
      ]}
      headerActions={
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 px-4 border-gray-200"
            onClick={() => router.push('/streams')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Streams
          </Button>
          <Button 
            className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent"
            onClick={() => router.push(`/streams/${id}/edit`)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Stream
          </Button>
        </div>
      }
    >
      <Card className="border-none shadow-none ring-1 ring-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Students</h3>
            <p className="text-sm text-gray-500">Manage all students enrolled in this stream</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-10 h-10 rounded-xl border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="p-0 bg-white">
          <PaginatedTable
            fetchFirstPage={fetchFirstPage}
            fetchFromUrl={getPaginatedFromUrl}
            columns={columns}
            showRowNumbers={true}
            skeletonRows={5}
            className="min-h-0!"
            tableClassName="[&_td]:py-4"
            deps={[searchTerm, id]}
            refreshRef={tableRefreshRef}
            emptyState={
              <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                <Users className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No students found</p>
                <p className="text-sm text-center max-w-sm mt-1">
                  There are no students currently enrolled in this stream.
                </p>
              </div>
            }
          />
        </div>
      </Card>
    </MainLayout>
  );
}
