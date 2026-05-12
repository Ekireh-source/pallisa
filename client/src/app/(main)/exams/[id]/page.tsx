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
  MoreVertical,
  Edit2
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Skeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui';
import { FetchExamById, FetchExamStudentScores, SaveBulkExamScores } from '@/features/exam/exam.service';
import { FetchSubjects } from '@/features/members/members.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [exam, setExam] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [fetchingScores, setFetchingScores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [examRes, subjectRes] = await Promise.all([
        FetchExamById(id),
        FetchSubjects()
      ]);

      if (examRes.success) setExam(examRes.data);
      if (subjectRes.success) setSubjects(subjectRes.data.results || subjectRes.data);
      
      setLoading(false);
    };

    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (selectedSubject) {
      loadScores();
    }
  }, [selectedSubject]);

  const loadScores = async () => {
    setFetchingScores(true);
    const result = await FetchExamStudentScores(id, parseInt(selectedSubject));
    if (result.success) {
      setStudents(result.data);
    } else {
      toast.error("Failed to load student scores");
    }
    setFetchingScores(false);
  };

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
    if (!selectedSubject) return;
    
    setSaving(true);
    const payload = {
      subject_id: parseInt(selectedSubject),
      scores: students.map(s => ({
        student_id: s.student_id,
        score: s.score,
        remarks: s.remarks
      }))
    };

    const result = await SaveBulkExamScores(id, payload);
    if (result.success) {
      toast.success("Scores saved successfully");
      loadScores();
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
      
      // Basic CSV parsing: AdmissionNumber, Score, Remarks
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
      
      toast.success("CSV data applied to table. Don't forget to save!");
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
    a.download = `${exam.name}_${subjects.find(s => s.id.toString() === selectedSubject)?.name}_Template.csv`;
    a.click();
  };

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200"
            onClick={() => router.push('/exams')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{exam.name}</h1>
              <Badge variant={exam.is_published ? 'default' : 'secondary'} className="rounded-full">
                {exam.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-gray-500 text-sm">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {exam.class_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(exam.start_date), 'MMM d')} - {format(new Date(exam.end_date), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11" onClick={() => router.push(`/exams/${id}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
          <Button 
            className="rounded-xl h-11 shadow-lg shadow-amber-200 bg-amber-600 hover:bg-amber-700"
            onClick={handleSaveAll}
            disabled={saving || !selectedSubject}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Marks
          </Button>
        </div>
      </div>

      {/* Subject & Filters */}
      <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-amber-500" />
              Select Subject
            </Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 shadow-sm">
                <SelectValue placeholder="Choose a subject to enter marks" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search student..." 
              className="pl-10 h-12 rounded-xl border-gray-200 bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl bg-white" 
              onClick={downloadTemplate}
              disabled={!selectedSubject}
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <div className="flex-1 relative">
              <Input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="bulk-upload" 
                onChange={handleBulkUpload}
                disabled={!selectedSubject}
              />
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl bg-white" 
                asChild
                disabled={!selectedSubject}
              >
                <label htmlFor="bulk-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </label>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {!selectedSubject ? (
          <div className="h-96 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
            <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Subject Selected</p>
            <p className="max-w-xs text-center mt-1">Please select a subject above to view the student list and enter examination marks.</p>
          </div>
        ) : fetchingScores ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold text-gray-900">Student Info</TableHead>
                  <TableHead className="w-[150px] font-semibold text-gray-900 text-center">Score (100%)</TableHead>
                  <TableHead className="font-semibold text-gray-900">Teacher Remarks</TableHead>
                  <TableHead className="w-20 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center text-gray-500">
                      No students found in this class.
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
                          max="100"
                          placeholder="0.0"
                          className="h-10 text-center font-bold text-amber-700 bg-amber-50/30 border-amber-100 focus:ring-amber-500 rounded-lg"
                          value={student.score === null ? '' : student.score}
                          onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Optional remarks..."
                          className="h-10 rounded-lg border-gray-100 focus:ring-amber-500"
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
        )}
      </Card>
    </div>
  );
}
