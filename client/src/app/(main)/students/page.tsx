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

export default function StudentsListPage() {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadStudents();
  }, [searchTerm, school?.campus]);

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
          <Button variant="outline" className="rounded-xl h-11 border-gray-200" onClick={() => toast.info("Bulk upload coming soon")}>
            <Plus className="w-4 h-4 mr-2" />
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
    </div>
  );
}
