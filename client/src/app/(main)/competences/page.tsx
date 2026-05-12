'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  BookOpen,
  LayoutGrid
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton
} from '@/components/ui';
import { FetchCompetencyAreas, DeleteCompetencyArea } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CompetencyAreasListPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadAreas = async () => {
    setLoading(true);
    const result = await FetchCompetencyAreas({ search: searchTerm });
    if (result.success) {
      setAreas(result.data.results || result.data);
    } else {
      toast.error("Failed to load competency areas");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAreas();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this competency area?")) {
      const result = await DeleteCompetencyArea(id);
      if (result.success) {
        toast.success("Competency area deleted successfully");
        loadAreas();
      } else {
        toast.error("Failed to delete competency area");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competency Areas</h1>
          <p className="text-gray-500 mt-1">Broader categories for assessment topics.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20 rounded-xl h-11 bg-primary hover:bg-primary/90" asChild>
          <Link href="/competences/create">
            <Plus className="w-4 h-4 mr-2" />
            New Area
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search areas..." 
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
                <TableHead className="w-[30%] font-semibold text-gray-900">Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Topic</TableHead>
                <TableHead className="font-semibold text-gray-900">Description</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <LayoutGrid className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No competency areas found</p>
                      <p className="text-sm">Create areas to categorize your integration activities.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <span>{area.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 font-medium">
                      {area.topic_name ? (
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                          {area.topic_name}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No topic linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <span className="line-clamp-1">{area.description || 'No description'}</span>
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
                            onClick={() => router.push(`/competences/${area.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Edit Area
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                            onClick={() => handleDelete(area.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Area
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
