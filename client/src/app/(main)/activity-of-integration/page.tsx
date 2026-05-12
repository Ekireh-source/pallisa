'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Zap,
  BookOpen,
  CheckCircle2,
  Calendar,
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
import { FetchActivities, DeleteActivity } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ActivitiesListPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const loadActivities = async () => {
    setLoading(true);
    const result = await FetchActivities({ search: searchTerm });
    if (result.success) {
      setActivities(result.data.results || result.data);
    } else {
      toast.error("Failed to load activities");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadActivities();
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      const result = await DeleteActivity(id);
      if (result.success) {
        toast.success("Activity deleted successfully");
        loadActivities();
      } else {
        toast.error("Failed to delete activity");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities of Integration</h1>
          <p className="text-gray-500 mt-1">Manage assessment tasks for the competency-based curriculum.</p>
        </div>
        <Button className="rounded-xl h-11 bg-primary" asChild>
          <Link href="/activity-of-integration/create">
            <Plus className="w-4 h-4 mr-2" />
            New Activity
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search activities..." 
              className="pl-10 h-10 rounded-xl border-gray-200 focus:ring-rose-500"
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
                <TableHead className="w-[45%] font-semibold text-gray-900">Topic & Subject</TableHead>
                <TableHead className="font-semibold text-gray-900">Academic Period</TableHead>
                <TableHead className="font-semibold text-gray-900">Max Score</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Zap className="w-12 h-12 text-gray-200 mb-4" />
                      <p className="text-lg font-medium">No activities found</p>
                      <p className="text-sm">Create activities to start assessing students.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.public_id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <Link href={`/activity-of-integration/${activity.public_id}`} className="hover:text-rose-600 transition-colors">
                            <span className="font-semibold">{activity.topic_name || `Topic ID: ${activity.topic}`}</span>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 font-normal">
                              {activity.subject_name}
                            </span>
                            {activity.competency_area_name && (
                              <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {activity.competency_area_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="text-gray-700 font-medium">{activity.term_name || `Term ID: ${activity.term}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 px-3">
                        {activity.max_score} Marks
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => router.push(`/activity-of-integration/${activity.public_id}`)}
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
                              onClick={() => router.push(`/activity-of-integration/${activity.public_id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2 text-rose-600" />
                              View Scores
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer py-2"
                              onClick={() => router.push(`/activity-of-integration/${activity.public_id}/edit`)}
                            >
                              <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                              Edit Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                              onClick={() => handleDelete(activity.public_id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Activity
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
