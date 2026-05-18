'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Eye,
  Printer,
  Calendar,
  GraduationCap,
  Layers,
  MoreVertical,
  CheckCircle2
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
  SelectValue
} from '@/components/ui';
import {
  FetchReportCards,
  GenerateReportCards
} from '@/features/reports/reports.service';
import AcademicYearSearchableSelect from '@/components/selects/academicyearsearchableselect';
import TermSearchableSelect from '@/components/selects/termsearchableselect';
import ClassSearchableSelect from '@/components/selects/classsearchableselect';
import StreamSearchableSelect from '@/components/selects/streamsearchableselect';
import { toast } from 'sonner';
import { ReportCard } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { MainLayout } from '@/components/layout/main-layout';

export default function ReportsPage() {
  const router = useRouter();
  // Data state
  const [reports, setReports] = useState<ReportCard[]>([]);

  // Selection state
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadReports = async () => {
    setLoading(true);
    const params: any = {};
    if (selectedYear) params.academic_year = selectedYear;
    if (selectedTerm) params.term = selectedTerm;
    if (selectedClass && selectedClass !== 'all') params.class_id = selectedClass;
    if (selectedStream && selectedStream !== 'all') params.stream_id = selectedStream;
    if (searchTerm) params.search = searchTerm;

    const res = await FetchReportCards(params);
    if (res.success) {
      setReports(res.data.results || res.data);
    } else {
      toast.error("Failed to load report cards");
    }
    setLoading(false);
  };

  useEffect(() => {
    setSelectedTerm('');
  }, [selectedYear]);

  useEffect(() => {
    setSelectedStream('');
  }, [selectedClass]);

  useEffect(() => {
    loadReports();
  }, [selectedYear, selectedTerm, selectedClass, selectedStream, searchTerm]);

  const stats = React.useMemo(() => {
    if (!reports.length) return { avg: '0%', top: 'N/A', ranked: 0 };

    const avg = (reports.reduce((acc, r) => acc + r.average_score, 0) / reports.length).toFixed(1) + '%';
    const sorted = [...reports].sort((a, b) => b.total_score - a.total_score);
    const top = sorted[0].student_name.split(' ')[0];
    const ranked = reports.filter(r => r.position).length;

    return { avg, top, ranked };
  }, [reports]);

  const handleGenerate = async () => {
    if (!selectedYear || !selectedTerm) {
      toast.error("Please select Academic Year and Term first");
      return;
    }

    setGenerating(true);
    const res = await GenerateReportCards({
      academic_year: parseInt(selectedYear),
      term: parseInt(selectedTerm),
      class_obj: (selectedClass && selectedClass !== 'all') ? parseInt(selectedClass) : undefined,
      stream: (selectedStream && selectedStream !== 'all') ? parseInt(selectedStream) : undefined,
      school: undefined, // Can be added if school context is available
    });

    if (res.success) {
      toast.success(res.data.message || "Report cards generated successfully");
      loadReports();
    } else {
      toast.error("Failed to generate report cards");
    }
    setGenerating(false);
  };

  return (
    <MainLayout
      title="Student Reports"
      description="Calculations: AOIs (20%) + Final Exam (80%). Each activity is shown in detail."
      headerActions={
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 hover:text-primary font-bold px-6 shadow-sm border border-transparent"
        >
          {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate Reports
        </Button>
      }
      stats={[
        { label: 'Total Reports', value: String(reports.length), icon: 'hugeicons:file-text' },
        { label: 'Avg. Performance', value: stats.avg, icon: 'hugeicons:graduation-cap' },
        { label: 'Top Performer', value: stats.top, icon: 'hugeicons:award-01' },
        { label: 'Positions Ranked', value: String(stats.ranked), icon: 'hugeicons:layers' },
      ]}
    >
      {/* Filter Card */}
      <Card className="p-6 border-none shadow-none ring-0 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <AcademicYearSearchableSelect
              value={selectedYear}
              onValueChange={setSelectedYear}
              placeholder="Select Year"
              triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <TermSearchableSelect
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              academicYearId={selectedYear}
              disabled={!selectedYear}
              placeholder="Select Term"
              triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <ClassSearchableSelect
              value={selectedClass}
              onValueChange={setSelectedClass}
              placeholder="All Classes"
              triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <StreamSearchableSelect
              value={selectedStream}
              onValueChange={setSelectedStream}
              classId={selectedClass}
              disabled={!selectedClass || selectedClass === 'all'}
              placeholder="All Streams"
              triggerClassName="h-10 rounded-xl border-gray-200 bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-none ring-0 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold py-4">Student</TableHead>
              <TableHead className="font-bold">Class</TableHead>
              <TableHead className="font-bold">Total Score</TableHead>
              <TableHead className="font-bold">Position</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : reports.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">No reports found.</TableCell></TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-indigo-50/20">
                  <TableCell className="font-bold">{report.student_name}</TableCell>
                  <TableCell>{report.class_name} ({report.stream_name})</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none">
                      {report.average_score}%
                    </Badge>
                  </TableCell>
                  <TableCell>{report.position ? `${report.position} / ${report.out_of}` : '--'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
                        <DropdownMenuItem 
                          className="cursor-pointer py-2 font-medium"
                          onClick={() => router.push(`/reports/${report.id}`)}
                        >
                          <Icon icon="hugeicons:view" className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer py-2"
                          onClick={() => toast.success("Download started...")}
                        >
                          <Icon icon="hugeicons:download-02" className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </MainLayout>
  );
}
