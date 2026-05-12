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
  Briefcase,
  Award,
  Calendar
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
  AvatarImage
} from '@/components/ui';
import { FetchTeachers, DeleteTeacher } from '@/features/members/members.service';
import { toast } from 'sonner';
import { ITeacher } from '@/features/members/members.schemas';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadTeachers = async () => {
    setLoading(true);
    const result = await FetchTeachers({ search: searchTerm });
    if (result.success) {
      setTeachers(result.data.results || result.data);
    } else {
      toast.error("Failed to load teachers");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      const result = await DeleteTeacher(id);
      if (result.success) {
        toast.success("Teacher deleted successfully");
        loadTeachers();
      } else {
        toast.error("Failed to delete teacher");
      }
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'full_time': return 'bg-emerald-100 text-emerald-700';
      case 'part_time': return 'bg-blue-100 text-blue-700';
      case 'contract': return 'bg-amber-100 text-amber-700';
      case 'substitute': return 'bg-purple-100 text-purple-700';
      case 'volunteer': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage school faculty and academic staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 border-gray-200" onClick={() => toast.info("Exporting coming soon")}>
            <Plus className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="shadow-lg shadow-primary/20 rounded-xl h-11 bg-primary hover:bg-primary/90" asChild>
            <Link href="/teachers/create">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Teacher
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name, ID or specialization..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg h-10">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900">Teacher</TableHead>
                <TableHead className="font-semibold text-gray-900">Employee ID</TableHead>
                <TableHead className="font-semibold text-gray-900">Specialization</TableHead>
                <TableHead className="font-semibold text-gray-900">Type</TableHead>
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
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Briefcase className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No teachers found</p>
                      <p className="text-sm">Register teachers to assign them to classes and subjects.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-gray-100">
                          <AvatarImage src={teacher.user_profile_data?.profile_picture} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                            {teacher.full_name?.[0] || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{teacher.full_name || 'Unnamed Teacher'}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {teacher.email || 'No email'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-900">{teacher.employee_id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 font-medium">
                          {teacher.specialization || 'Not specified'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Award className="w-3 h-3" /> {teacher.qualification || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full px-3 py-0.5 border-none capitalize ${getEmploymentTypeColor(teacher.employment_type)}`}>
                        {teacher.employment_type?.replace('_', ' ') || 'N/A'}
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
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/teachers/${teacher.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/teachers/${teacher.id}/assignments`)}
                          >
                            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                            View Assignments
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(teacher.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Teacher
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
