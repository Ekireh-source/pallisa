'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Layers,
  Users,
  CheckCircle2,
  XCircle,
  Building2
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { FetchClasses, DeleteClass } from '@/features/members/members.service';
import { FetchCampuses } from '@/features/school/school.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClassesListPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const router = useRouter();

  const loadClasses = async () => {
    setLoading(true);
    const params: any = { search: searchTerm };
    if (selectedCampus !== 'all') {
      params.campus_id = selectedCampus;
    }
    const result = await FetchClasses(params);
    if (result.success) {
      setClasses(result.data.results || result.data);
    } else {
      toast.error("Failed to load classes");
    }
    setLoading(false);
  };

  const loadCampuses = async () => {
    const result = await FetchCampuses();
    if (result.success) {
      setCampuses(result.data.results || result.data);
    }
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [searchTerm, selectedCampus]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this class?")) {
      const result = await DeleteClass(id);
      if (result.success) {
        toast.success("Class deleted successfully");
        loadClasses();
      } else {
        toast.error("Failed to delete class");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage grade levels and student groups.</p>
        </div>
        <Button className="rounded-xl h-11 bg-primary" asChild>
          <Link href="/classes/create">
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search classes..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger className="w-[180px] h-10 rounded-lg border-gray-200">
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-gray-100">
                <SelectItem value="all">All Campuses</SelectItem>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id.toString()}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[30%] font-semibold text-gray-900">Class Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Campus</TableHead>
                <TableHead className="font-semibold text-gray-900">Streams</TableHead>
                <TableHead className="font-semibold text-gray-900">Created At</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Layers className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No classes defined</p>
                      <p className="text-sm">Start by adding grade levels (e.g., Primary 1, Senior 1).</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>{cls.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{cls.campus_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{cls.stream_count || 0} Streams</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(cls.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={cls.is_active ? 'default' : 'secondary'}
                        className={`rounded-full px-3 ${
                          cls.is_active 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-none'
                        }`}
                      >
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-100">
                          <DropdownMenuItem 
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/classes/${cls.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(cls.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Class
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
