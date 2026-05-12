'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
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
  Skeleton
} from '@/components/ui';
import { FetchExams, DeleteExam } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function ExamsListPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadExams = async () => {
    setLoading(true);
    const result = await FetchExams({ search: searchTerm });
    if (result.success) {
      setExams(result.data.results || result.data);
    } else {
      toast.error("Failed to load exams");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExams();
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      const result = await DeleteExam(id);
      if (result.success) {
        toast.success("Exam deleted successfully");
        loadExams();
      } else {
        toast.error("Failed to delete exam");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Examinations</h1>
          <p className="text-gray-500 mt-1">Schedule and manage school-wide assessments.</p>
        </div>
        <Button className="rounded-xl h-11 bg-primary" asChild>
          <Link href="/exams/create">
            <Plus className="w-4 h-4 mr-2" />
            New Exam
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search exams..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-amber-500"
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
                <TableHead className="w-[30%] font-semibold text-gray-900">Exam Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Academic Period</TableHead>
                <TableHead className="font-semibold text-gray-900">Duration</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ClipboardCheck className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No exams scheduled</p>
                      <p className="text-sm">Create a new exam to begin assessments.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.public_id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary text-amber-600">
                          <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <Link href={`/exams/${exam.public_id}`} className="hover:text-amber-600 transition-colors">
                            <span className="font-semibold">{exam.name}</span>
                          </Link>
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1">
                            {exam.class_name || `Class ID: ${exam.class_obj}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium text-gray-700">{exam.term_name || `Term ID: ${exam.term}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-gray-600 gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {format(new Date(exam.start_date), 'MMM d')} - {format(new Date(exam.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={exam.is_published ? 'default' : 'secondary'}
                        className={`rounded-full px-3 py-1 ${
                          exam.is_published 
                            ? 'bg-primary text-white  border-none' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-none'
                        }`}
                      >
                        {exam.is_published ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => router.push(`/exams/${exam.public_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
                            <DropdownMenuItem 
                              className="cursor-pointer py-2"
                              onClick={() => router.push(`/exams/${exam.public_id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2 text-amber-600" />
                              View Marks
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer py-2"
                              onClick={() => router.push(`/exams/${exam.public_id}/edit`)}
                            >
                              <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                              onClick={() => handleDelete(exam.public_id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Exam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
