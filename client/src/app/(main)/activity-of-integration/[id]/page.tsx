'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Save, 
  ClipboardCheck, 
  Calendar, 
  Users,
  Search,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  BookOpen,
  User,
  Edit2,
  Trophy
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Skeleton
} from '@/components/ui';
import { FetchActivityById, FetchActivityStudentScores, SaveBulkActivityScores } from '@/features/exam/exam.service';
import { toast } from 'sonner';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [activity, setActivity] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [activityRes, scoresRes] = await Promise.all([
        FetchActivityById(id),
        FetchActivityStudentScores(id)
      ]);

      if (activityRes.success) setActivity(activityRes.data);
      if (scoresRes.success) setStudents(scoresRes.data);
      
      setLoading(false);
    };

    loadInitialData();
  }, [id]);

  const handleScoreChange = (studentId: number, value: string) => {
    setStudents(prev => prev.map(s => 
      s.student_id === studentId ? { ...s, score: value === '' ? null : parseFloat(value) } : s
    ));
  };

  const handleRemarksChange = (studentId: number, value: string) => {
    setStudents(prev => prev.map(s => 
      s.student_id === studentId ? { ...s, remarks: value } : s
    ));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const payload = {
      scores: students.map(s => ({
        student_id: s.student_id,
        score: s.score,
        remarks: s.remarks
      }))
    };

    const result = await SaveBulkActivityScores(id, payload);
    if (result.success) {
      toast.success("Integration scores saved successfully");
      const scoresRes = await FetchActivityStudentScores(id);
      if (scoresRes.success) setStudents(scoresRes.data);
    } else {
      toast.error("Failed to save scores");
    }
    setSaving(false);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newScores: any = {};
      
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const parts = line.split(',');
        if (parts.length >= 2) {
          const admNo = parts[0].trim();
          const score = parseFloat(parts[1].trim());
          const remarks = parts[2]?.trim() || '';
          if (admNo && !isNaN(score)) {
            newScores[admNo] = { score, remarks };
          }
        }
      });

      setStudents(prev => prev.map(s => {
        const upload = newScores[s.admission_number];
        if (upload) {
          return { ...s, score: upload.score, remarks: upload.remarks };
        }
        return s;
      }));
      
      toast.success("CSV data applied to table. Click 'Save All' to persist.");
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = "AdmissionNumber,Score,Remarks\n";
    const rows = students.map(s => `${s.admission_number},${s.score || ''},${s.remarks || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activity.title}_Template.csv`;
    a.click();
  };

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200"
            onClick={() => router.push('/activity-of-integration')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{activity.title}</h1>
              <Badge className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                Integration Activity
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {activity.topic_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Max Score: {activity.max_score}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11" onClick={() => router.push(`/activity-of-integration/${id}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Activity
          </Button>
          <Button 
            className="rounded-xl h-11 shadow-lg shadow-blue-200 bg-primary hover:bg-primary/90"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Scores
          </Button>
        </div>
      </div>

      {/* Scenario & Task (Read-only Info) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Scenario</h3>
          <p className="text-gray-700 leading-relaxed italic">"{activity.scenario}"</p>
        </Card>
        <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Task Description</h3>
          <p className="text-gray-700 leading-relaxed">{activity.task_description}</p>
        </Card>
      </div>

      {/* Filters & Bulk Tools */}
      <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search student..." 
              className="pl-10 h-12 rounded-xl border-gray-200 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl bg-white border-gray-200" 
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <div className="flex-1 relative">
              <Input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="activity-bulk-upload" 
                onChange={handleBulkUpload}
              />
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl bg-white border-gray-200" 
                asChild
              >
                <label htmlFor="activity-bulk-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload Scores
                </label>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-gray-900">Student Name</TableHead>
                <TableHead className="w-[150px] font-semibold text-gray-900 text-center">Score (/{activity.max_score})</TableHead>
                <TableHead className="font-semibold text-gray-900">Teacher Remarks</TableHead>
                <TableHead className="w-20 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                    No students found for this activity.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.student_id} className="hover:bg-gray-50/30 transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{student.student_name}</span>
                        <span className="text-xs text-gray-500">{student.admission_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0" 
                        max={activity.max_score}
                        step="0.5"
                        placeholder="0.0"
                        className="h-10 text-center font-bold text-blue-700 bg-blue-50/30 border-blue-100 focus:ring-blue-500 rounded-lg"
                        value={student.score === null ? '' : student.score}
                        onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Observation remarks..."
                        className="h-10 rounded-lg border-gray-100 focus:ring-blue-500"
                        value={student.remarks}
                        onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {student.score_id && (
                        <div className="flex items-center justify-end text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
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
