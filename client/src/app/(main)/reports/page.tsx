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
import {
  FetchAcademicYears,
  FetchTerms,
  FetchClasses,
  FetchStreams
} from '@/features/members/members.service';
import { toast } from 'sonner';
import { ReportCard, AcademicYear, Term, MemberClass, MemberStream } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  // Data state
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<MemberClass[]>([]);
  const [streams, setStreams] = useState<MemberStream[]>([]);

  // Selection state
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadInitialData = async () => {
    const [yearsRes, classesRes] = await Promise.all([
      FetchAcademicYears(),
      FetchClasses()
    ]);

    if (yearsRes.success) setYears(yearsRes.data.results || yearsRes.data);
    if (classesRes.success) setClasses(classesRes.data.results || classesRes.data);
  };

  const loadTerms = async (yearId: string) => {
    const res = await FetchTerms({ academic_year: yearId });
    if (res.success) setTerms(res.data.results || res.data);
  };

  const loadStreams = async (classId: string) => {
    const res = await FetchStreams({ class_obj: classId });
    if (res.success) setStreams(res.data.results || res.data);
  };

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
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) loadTerms(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedClass) loadStreams(selectedClass);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Student Reports</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Calculations: AOIs (20%) + Final Exam (80%). Each activity is shown in detail.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90"
        >
          {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Generate Reports
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg. Performance', value: stats.avg, icon: GraduationCap, color: 'text-primary', bg: 'bg-emerald-50' },
          { label: 'Top Performer', value: stats.top, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Positions Ranked', value: stats.ranked, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-none shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Card */}
      <Card className="p-6 border-none shadow-md ring-1 ring-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Academic Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Year" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Term</label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!selectedYear}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select Term" /></SelectTrigger>
              <SelectContent>
                {terms.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Stream</label>
            <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedClass || selectedClass === 'all'}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Streams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {streams.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-lg ring-1 ring-gray-100 overflow-hidden">
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
                    <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                      <Link href={`/reports/${report.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl"><Download className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
