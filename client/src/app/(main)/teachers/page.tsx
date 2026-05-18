'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { 
  Search, 
  Mail,
  UserPlus,
  Briefcase,
  Calendar,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui';
import { FetchTeachers, DeleteTeacher, BulkUploadTeachers } from '@/features/members/members.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { getPaginatedFromUrl } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';

export default function TeachersListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  
  const tableRefreshRef = useRef<any>(null);

  const fetchFirstPage = (query?: any) => {
    return FetchTeachers(query);
  };

  const downloadTemplate = () => {
    const template = [
      {
        user_email: 'teacher@example.com',
        user_first_name: 'Jane',
        user_last_name: 'Smith',
        user_gender: 'F',
        user_phone: '+1234567890',
        employment_type: 'full_time',
        specialization: 'Mathematics',
        joining_date: '2024-01-01',
        employee_id: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers Template");
    
    // Add info about types
    const info = [
      ["Employment Types: full_time, part_time, contract, substitute, volunteer"],
      ["Genders: M (Male), F (Female), O (Other)"],
      ["Date Format: YYYY-MM-DD"],
      [""],
      ["Note: Leave employee_id blank to autogenerate."]
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(info);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

    XLSX.writeFile(wb, "teachers_bulk_upload_template.xlsx");
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

        const result = await BulkUploadTeachers({ teachers: jsonData });
        if (result.success) {
          toast.success(`Successfully uploaded ${result.data.created_count} teachers`);
          setIsUploadModalOpen(false);
          tableRefreshRef.current?.refresh();
        } else {
          const errorMessage = result.error?.response?.data?.error || "Failed to upload teachers";
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
    if (confirm("Are you sure you want to delete this teacher?")) {
      const res = await DeleteTeacher(id);
      if (res.success) {
        toast.success("Teacher deleted successfully");
        tableRefreshRef.current?.refresh();
      } else {
        toast.error("Failed to delete teacher");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      header: "Teacher",
      cell: (teacher) => (
        <div className="font-bold flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-gray-100 rounded-xl">
            <AvatarImage src={teacher.profile_picture} alt={teacher.full_name} className="object-cover" />
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold rounded-xl">
              {teacher.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'TR'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-gray-900 font-bold">{teacher.full_name}</p>
            <p className="text-xs text-gray-400 font-normal">License: {teacher.license_number || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      cell: (teacher) => (
        <span className="font-medium text-gray-600">{teacher.specialization || 'N/A'}</span>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      cell: (teacher) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          <div className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 font-medium">{teacher.email || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (teacher) => (
        teacher.active ? (
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
      cell: (teacher) => (
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
                onClick={() => router.push(`/teachers/${teacher.id}`)}
              >
                <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/teachers/${teacher.id}/edit`)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit Info
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => router.push(`/teachers/${teacher.id}/assignments`)}
              >
                <Icon icon="hugeicons:calendar-03" className="w-4 h-4 mr-2" />
                View Assignments
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(teacher.id)}
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
      title="Teachers"
      description="Manage school faculty and academic staff."
      headerActions={
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold" 
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent" asChild>
            <Link href="/teachers/create">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Teacher
            </Link>
          </Button>
        </div>
      }
    >
      <Card className="border-none shadow-none ring-0">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name, ID or specialization..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-indigo-500 w-full"
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
                <Briefcase className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-lg font-medium">No teachers found</p>
                <p className="text-sm">Register teachers to assign them to classes and subjects.</p>
              </div>
            }
          />
        </div>
      </Card>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
            <DialogHeader>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">Bulk Teacher Upload</DialogTitle>
              <DialogDescription className="text-indigo-100 mt-2">
                Register multiple teachers at once using an Excel template.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-800 text-sm">
              <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p>
                Download the template, fill in the details, and upload it back. Login credentials will be sent to the teachers' emails.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button 
                variant="outline" 
                className="h-16 rounded-2xl border-dashed border-2 hover:bg-indigo-50 hover:border-indigo-200 flex flex-col items-center justify-center gap-1 group transition-all"
                onClick={downloadTemplate}
              >
                <div className="flex items-center text-indigo-600 font-semibold">
                  <Download className="w-4 h-4 mr-2 group-hover:bounce" />
                  Download Template
                </div>
                <span className="text-[10px] text-gray-500 font-normal">Excel file with sample teacher data</span>
              </Button>

              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                <div className={`h-32 rounded-2xl border-dashed border-2 flex flex-col items-center justify-center gap-3 transition-all ${isUploading ? 'bg-gray-50 border-gray-200' : 'border-indigo-200 bg-indigo-50/30 group-hover:bg-indigo-50 group-hover:border-indigo-300'}`}>
                  {isUploading ? (
                    <>
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-indigo-600">Processing File...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-indigo-900">Click to upload Excel file</p>
                        <p className="text-xs text-gray-500">Max size 5MB (.xlsx, .xls)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex sm:justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setIsUploadModalOpen(false)}
              className="rounded-xl hover:bg-white"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
