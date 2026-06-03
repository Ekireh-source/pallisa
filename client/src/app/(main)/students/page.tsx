'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import {
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  GraduationCap,
  Mail,
  Building2,
  Eye,
  History,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  ChevronDown,
  MoreVertical
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
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui';
import { FetchStudents, DeleteStudent, BulkUploadStudents, FetchStreams } from '@/features/members/members.service';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import { FetchCampuses } from '@/features/school/school.service';
import StreamSearchableSelect from '@/components/selects/streamsearchableselect';
import { toast } from 'sonner';
import { IStudent } from '@/features/members/members.schemas';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectSchool } from '@/store/auth/selectors';
import * as XLSX from 'xlsx';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import api from '@/lib/api';
import { getPaginatedFromUrl } from '@/lib/utils';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import { BulkStudentUpload } from '@/components/forms/BulkStudentUpload';

export default function StudentsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const router = useRouter();

  const tableRefreshRef = useRef<(() => void) | null>(null);

  // Get school from selector
  const school = useSelector(selectSchool);

  const fetchFirstPage = async (query?: any) => {
    const params: any = {
      search: query?.search || undefined,
      campus_id: school?.campus || undefined,
      school: query?.school || undefined
    };

    if (query?.stream && query.stream !== 'all') {
      params.stream_id = query.stream;
    }

    const result = await FetchStudents(params);
    if ('error' in result) {
      throw result.error;
    }
    return result;
  };

  const loadReferenceData = async () => {
    const [campusesRes, streamsRes] = await Promise.all([
      FetchCampuses(),
      FetchStreams()
    ]);
    if (campusesRes && 'results' in campusesRes) setCampuses(campusesRes.results);
    if (streamsRes && 'results' in streamsRes) setStreams(streamsRes.results);
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const downloadTemplate = () => {
    const template = [
      {
        user_email: 'student@example.com',
        user_first_name: 'John',
        user_last_name: 'Doe',
        user_gender: 'M',
        campus: school?.campus || 1,
        current_stream: 1,
        student_id: '',
        admission_number: 'ADM001',
        enrollment_status: 'enrolled'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");

    // Add info about IDs
    const info = [
      ["Note: campus and current_stream must be valid IDs from the lists below."],
      ["Genders: M (Male), F (Female), O (Other)"],
      ["Status: enrolled, graduated, suspended, transferred, withdrawn"],
      [""],
      ["AVAILABLE CAMPUSES:"],
      ["ID", "Name"],
      ...campuses.map(c => [c.id, c.name]),
      [""],
      ["AVAILABLE STREAMS:"],
      ["ID", "Name", "Class"],
      ...streams.map(s => [s.id, s.name, s.class_name])
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(info);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Reference Data");

    XLSX.writeFile(wb, "students_bulk_upload_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsUploading(true);
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          toast.error("The file is empty");
          setIsUploading(false);
          return;
        }

        const result = await BulkUploadStudents({ students: jsonData });
        if (result.success) {
          toast.success(`Successfully uploaded ${result.data.created_count} students`);
          setIsUploadModalOpen(false);
          tableRefreshRef.current?.();
        } else {
          const errorMessage = "Failed to upload students";
          toast.error(errorMessage);
          console.error("Bulk upload error:", result.error);
        }
      } catch (error) {
        toast.error("Error parsing Excel file");
        console.error(error);
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      const result = await DeleteStudent(id);
      if (result.success) {
        toast.success("Student deleted successfully");
        tableRefreshRef.current?.();
      } else {
        toast.error("Failed to delete student");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-emerald-100 text-emerald-700';
      case 'graduated': return 'bg-blue-100 text-blue-700';
      case 'suspended': return 'bg-amber-100 text-amber-700';
      case 'transferred': return 'bg-purple-100 text-purple-700';
      case 'withdrawn': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-My-Black';
    }
  };

  const columns: ColumnDef<IStudent>[] = [
    {
      key: "student",
      header: "Student",
      cell: (student) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={student.user_profile_data?.profile_picture || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {student.full_name?.[0] || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link
              href={`/students/${student.id}`}
              className="font-semibold text-My-Black hover:text-primary transition-colors"
            >
              {student.full_name || 'Unnamed Student'}
            </Link>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {student.email || 'No email'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "student_id",
      header: "ID / Admission / LIN",
      cell: (student) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-My-Black">{student.student_id}</span>
          <span className="text-xs text-gray-500">Adm: {student.admission_number || 'N/A'}</span>
          {student.lin && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">LIN: {student.lin}</span>}
        </div>
      ),
    },
    {
      key: "class_stream",
      header: "Class & Stream",
      cell: (student) => (
        <div className="flex flex-col">
          <span className="text-sm text-My-Black font-medium">
            {student.current_class_name || 'No Class'}
          </span>
          <span className="text-xs text-gray-500">
            {student.current_stream_name || 'No Stream'}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (student) => (
        <Badge className={`rounded-full px-3 py-0.5 border-none capitalize ${getStatusColor(student.enrollment_status || '')}`}>
          {student.enrollment_status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (student) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-My-Black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl -xl border-gray-100">
              <DropdownMenuItem
                className="cursor-pointer py-2 font-medium"
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
                className="cursor-pointer py-2"
                onClick={() => router.push(`/students/${student.id}/history`)}
              >
                <Icon icon="hugeicons:task-list-done" className="w-4 h-4 mr-2" />
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(student.id)}
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
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_STUDENTS}>
      <MainLayout
        title="Students"
        description="Manage student enrollment and profiles."
        headerActions={
          <ResponsiveHeaderActions
            primary={{
              label: "Add Student",
              icon: <UserPlus className="w-4 h-4" />,
              href: "/students/create",
            }}
            secondary={[
              {
                label: "Bulk Upload",
                icon: <FileSpreadsheet className="w-4 h-4" />,
                onClick: () => setIsUploadModalOpen(true),
              },
            ]}
          />
        }
      >
        <Card className="border-none -none ring-0">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                <Input
                  placeholder="Search by name, ID or email..."
                  className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-primary w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <StreamSearchableSelect
                  value={streamFilter}
                  onValueChange={setStreamFilter}
                  placeholder="All Streams"
                  triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
                  hideLabel
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {school?.campus_name && (
                <Badge variant="outline" className="h-10 px-4 rounded-lg bg-primary/10 text-primary border-primary/20 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {school.campus_name}
                </Badge>
              )}
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
              query={{ search: searchTerm, stream: streamFilter, school: school?.id }}
              deps={[searchTerm, streamFilter, school]}
              refreshRef={tableRefreshRef}
              emptyState={
                <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                  <GraduationCap className="w-12 h-12 text-My-Black mb-4" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-sm">Add students to start managing their academic records.</p>
                </div>
              }
            />
          </div>
        </Card>

        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-3xl p-6 overflow-y-auto max-h-[90vh] border-none -2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Bulk Student Upload</DialogTitle>
              <DialogDescription>
                Upload multiple students at once using an Excel template. Complete validation before committing the upload.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <BulkStudentUpload
                onSuccess={() => {
                  setIsUploadModalOpen(false);
                  tableRefreshRef.current?.();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </ProtectedComponent>
  );
}

