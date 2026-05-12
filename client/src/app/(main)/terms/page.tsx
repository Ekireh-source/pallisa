'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle
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
import { FetchTerms, DeleteTerm } from '@/features/members/members.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function TermsListPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadTerms = async () => {
    setLoading(true);
    const result = await FetchTerms({ search: searchTerm });
    if (result.success) {
      setTerms(result.data.results || result.data);
    } else {
      toast.error("Failed to load terms");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTerms();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this term?")) {
      const result = await DeleteTerm(id);
      if (result.success) {
        toast.success("Term deleted successfully");
        loadTerms();
      } else {
        toast.error("Failed to delete term");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Terms</h1>
          <p className="text-gray-500 mt-1">Manage semesters and school terms within academic years.</p>
        </div>
        <Button className="rounded-xl h-11 bg-primary" asChild>
          <Link href="/terms/create">
            <Plus className="w-4 h-4 mr-2" />
            Add Term
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search terms..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-violet-500"
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
                <TableHead className="w-[25%] font-semibold text-gray-900">Term Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Academic Year</TableHead>
                <TableHead className="font-semibold text-gray-900">Duration</TableHead>
                <TableHead className="font-semibold text-gray-900">Current</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : terms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Clock className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No terms found</p>
                      <p className="text-sm">Define terms like "Term 1", "Semester 2" etc.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((term) => (
                  <TableRow key={term.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>{term.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{term.academic_year_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-gray-600 gap-2">
                        <span>
                          {format(new Date(term.start_date), 'MMM d')} - {format(new Date(term.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {term.is_current ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Yes
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={term.is_active ? 'default' : 'secondary'}
                        className={`rounded-full px-3 py-1 ${
                          term.is_active 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-none'
                        }`}
                      >
                        {term.is_active ? 'Active' : 'Inactive'}
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
                            onClick={() => router.push(`/terms/${term.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit Term
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(term.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Term
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
