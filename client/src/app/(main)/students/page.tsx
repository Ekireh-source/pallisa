'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Mail,
  Phone,
  ArrowUpDown,
  History,
  UserPlus,
  Building2,
  Eye
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui';
import { FetchStudents, DeleteStudent } from '@/features/members/members.service';
import { toast } from 'sonner';
import { IStudent } from '@/features/members/members.schemas';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectSchool } from '@/store/auth/selectors';
import * as XLSX from 'xlsx';
import { BulkUploadStudents, FetchStreams } from '@/features/members/members.service';
import { FetchCampuses } from '@/features/school/school.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui';
import { Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function StudentsListPage() {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const router = useRouter();

  // Get school from selector
  const school = useSelector(selectSchool);

  const loadStudents = async () => {
    setLoading(true);
    // Use campus ID from school in state if available
    const params: any = { 
      search: searchTerm,
      campus_id: school?.campus
    };

    const result = await FetchStudents(params);
    if (result.success) {
      setStudents(result.data.results || result.data);
    } else {
      toast.error("Failed to load students");
    }
    setLoading(false);
  };

  const loadReferenceData = async () => {
    const [campusesRes, streamsRes] = await Promise.all([
      FetchCampuses(),
      FetchStreams()
    ]);
    if (campusesRes.success) setCampuses(campusesRes.data.results || campusesRes.data);
    if (streamsRes.success) setStreams(streamsRes.data.results || streamsRes.data);
  };

  useEffect(() => {
    loadStudents();
    loadReferenceData();
  }, [searchTerm, school?.campus]);

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
          loadStudents();
        } else {
          const errorMessage = result.error?.response?.data?.error || "Failed to upload students";
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
        loadStudents();
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
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage student enrollment and profiles.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 border-gray-200" 
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button className="shadow-lg shadow-primary/20 rounded-xl h-11 bg-primary hover:bg-primary/90" asChild>
            <Link href="/students/create">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID or email..."
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg h-10 text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {school?.campus_name && (
              <Badge variant="outline" className="h-10 px-4 rounded-lg bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                {school.campus_name}
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900">Student</TableHead>
                <TableHead className="font-semibold text-gray-900">ID / Admission</TableHead>
                <TableHead className="font-semibold text-gray-900">Class & Stream</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-48 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <GraduationCap className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">Add students to start managing their academic records.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-gray-100">
                          <AvatarImage src={student.user_profile_data?.profile_picture} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                            {student.full_name?.[0] || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <Link 
                            href={`/students/${student.id}`}
                            className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                          >
                            {student.full_name || 'Unnamed Student'}
                          </Link>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {student.email || 'No email'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{student.student_id}</span>
                        <span className="text-xs text-gray-500">{student.admission_number || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 font-medium">
                          {student.current_class_name || 'No Class'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.current_stream_name || 'No Stream'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full px-3 py-0.5 border-none capitalize ${getStatusColor(student.enrollment_status)}`}>
                        {student.enrollment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
                          <DropdownMenuItem
                            className="cursor-pointer py-2 font-medium"
                            onClick={() => router.push(`/students/${student.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2 text-indigo-600" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/students/${student.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/students/${student.id}/history`)}
                          >
                            <History className="w-4 h-4 mr-2 text-indigo-600" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white">
            <DialogHeader>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">Bulk Student Upload</DialogTitle>
              <DialogDescription className="text-indigo-100 mt-2">
                Upload multiple students at once using an Excel template.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Ensure your Excel file follows the template structure. Campus and Stream must use their numeric IDs.
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
                <span className="text-[10px] text-gray-500 font-normal">Excel file with sample data and reference IDs</span>
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
    </div>
  );
}
