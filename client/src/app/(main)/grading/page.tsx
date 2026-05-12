'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Layers,
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
import { FetchGradingSystems, DeleteGradingSystem } from '@/features/reports/reports.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GradingSystem } from '@/types';
import { useAppSelector } from '@/store';

export default function GradingSystemsListPage() {
  const [systems, setSystems] = useState<GradingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { school } = useAppSelector((state) => state.auth);

  const loadSystems = async () => {
    setLoading(true);
    const result = await FetchGradingSystems({ search: searchTerm, school: school?.id });
    if (result.success) {
      setSystems(result.data.results || result.data);
    } else {
      toast.error("Failed to load grading systems");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (school?.id) {
      loadSystems();
    }
  }, [searchTerm, school?.id]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this grading system?")) {
      const result = await DeleteGradingSystem(id);
      if (result.success) {
        toast.success("Grading system deleted successfully");
        loadSystems();
      } else {
        toast.error("Failed to delete grading system");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grading Systems</h1>
          <p className="text-gray-500 mt-1">Manage grading scales and boundaries for student report cards.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20 rounded-xl h-11 bg-primary hover:bg-primary/90" asChild>
          <Link href="/grading/create">
            <Plus className="w-4 h-4 mr-2" />
            New Grading System
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search grading systems..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[30%] font-semibold text-gray-900">Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Description</TableHead>
                <TableHead className="font-semibold text-gray-900">Boundaries</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : systems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Layers className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No grading systems found</p>
                      <p className="text-sm">Create a grading system to define score boundaries.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                systems.map((system) => (
                  <TableRow key={system.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>{system.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {system.description || <span className="text-gray-400 italic">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">
                        {system.boundaries?.length || 0} grades
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={system.is_active ? 'default' : 'secondary'}
                        className={`rounded-full px-3 py-1 ${
                          system.is_active 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-none'
                        }`}
                      >
                        {system.is_active ? 'Active' : 'Inactive'}
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
                            onClick={() => router.push(`/grading/${system.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2 text-indigo-600" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2"
                            onClick={() => router.push(`/grading/${system.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(system.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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
