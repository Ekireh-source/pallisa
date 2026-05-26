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
import { FetchSubjects, FetchSubjectById } from '@/features/members/members.service';
import SubjectSearchableSelect from '@/components/selects/subjectsearchableselect';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import Link from 'next/link';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

const formatDateSafe = (dateString?: string, formatStr: string = 'MMM d, yyyy') => {
  if (!dateString) return 'Date not set';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Date not set';
    return format(d, formatStr);
  } catch (e) {
    return 'Date not set';
  }
};

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [exam, setExam] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubjectData, setSelectedSubjectData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [fetchingScores, setFetchingScores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isOLevel = exam?.class_level?.toLowerCase() === '0level' || exam?.class_level?.toLowerCase() === 'olevel';
  const hasPapers = !isOLevel && selectedSubjectData?.papers?.length > 0;

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const examRes = await FetchExamById(id);
      if (examRes.success) setExam(examRes.data);
      setLoading(false);
    };

    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (selectedSubject) {
      loadSubjectData();
      loadScores();
    } else {
      setSelectedSubjectData(null);
    }
  }, [selectedSubject]);

  const loadSubjectData = async () => {
    const res = await FetchSubjectById(selectedSubject);
    if (res.success) {
      setSelectedSubjectData(res.data);
    }
  };

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

  const handleScoreChange = (studentId: number, value: string, paperId?: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setStudents(prev => prev.map(s => {
      if (s.student_id === studentId) {
        if (paperId) {
          return {
            ...s,
            papers: {
              ...(s.papers || {}),
              [paperId]: numValue
            }
          };
        }
        return { ...s, score: numValue };
      }
      return s;
    }));
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
        remarks: s.remarks,
        papers: s.papers || {}
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
      
      let headers: string[] = [];
      
      lines.forEach((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        if (index === 0) {
           headers = parts;
           return;
        }
        
        if (parts.length >= 2) {
          const admNo = parts[0];
          const uploadData: any = { papers: {}, score: null, remarks: '' };
          
          if (hasPapers) {
             let remarksIndex = headers.findIndex(h => h.toLowerCase() === 'remarks');
             if (remarksIndex === -1) remarksIndex = parts.length - 1;
             
             selectedSubjectData.papers.forEach((paper: any) => {
                const paperIndex = headers.indexOf(paper.name);
                if (paperIndex !== -1 && parts[paperIndex]) {
                   const s = parseFloat(parts[paperIndex]);
                   if (!isNaN(s)) uploadData.papers[paper.id] = s;
                }
             });
             uploadData.remarks = parts[remarksIndex] || '';
             newScores[admNo] = uploadData;
          } else {
             const score = parseFloat(parts[1]);
             const remarks = parts[2] || '';
             if (admNo && !isNaN(score)) {
                uploadData.score = score;
                uploadData.remarks = remarks;
                newScores[admNo] = uploadData;
             }
          }
        }
      });

      setStudents(prev => prev.map(s => {
        const upload = newScores[s.admission_number];
        if (upload) {
          if (hasPapers) {
             return { ...s, papers: { ...(s.papers || {}), ...upload.papers }, remarks: upload.remarks };
          }
          return { ...s, score: upload.score, remarks: upload.remarks };
        }
        return s;
      }));
      
      toast.success("CSV data applied to table. Don't forget to save!");
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    let header = "AdmissionNumber,Score,Remarks\n";
    if (hasPapers) {
      const paperNames = selectedSubjectData.papers.map((p: any) => p.name).join(',');
      header = `AdmissionNumber,${paperNames},Remarks\n`;
    }
    
    const rows = students.map(s => {
      if (hasPapers) {
         const paperScores = selectedSubjectData.papers.map((p: any) => s.papers?.[p.id] ?? '').join(',');
         return `${s.admission_number},${paperScores},${s.remarks || ''}`;
      }
      return `${s.admission_number},${s.score ?? ''},${s.remarks || ''}`;
    }).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.name}_${selectedSubjectData?.name || 'Subject'}_Template.csv`;
    a.click();
  };

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_GRADING}>
    <MainLayout
        title={<Skeleton className="h-8 w-48 bg-white/20" />}
        description="Loading exam details..."
        backButton={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50" disabled>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        }
      >
        <div className="space-y-8 animate-pulse pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </MainLayout>
    </ProtectedComponent>
    );
  }

  return (
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <span>{exam?.name || "Exam Details"}</span>
          {exam && (
            <Badge variant={exam.is_published ? 'default' : 'secondary'} className="rounded-full bg-white/20 text-white hover:bg-white/30 border-none">
              {exam.is_published ? 'Published' : 'Draft'}
            </Badge>
          )}
        </div>
      }
      description={exam ? `${exam.class_name} • ${exam.start_date && exam.end_date ? `${formatDateSafe(exam.start_date, 'MMM d')} - ${formatDateSafe(exam.end_date, 'MMM d, yyyy')}` : 'Date not set'}` : "Manage the scores and records for this examination."}
      backButton={
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          onClick={() => router.push('/exams')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      actionCols={2}
      headerActions={
        <ResponsiveHeaderActions
          primary={{
            label: saving ? "Saving..." : "Save All Marks",
            icon: saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />,
            onClick: handleSaveAll,
          }}
          secondary={[
            {
              label: "Edit Settings",
              icon: <Edit2 className="w-4 h-4" />,
              href: `/exams/${id}/edit`,
            }
          ]}
        />
      }
    >
      <div className="space-y-8 animate-in fade-in duration-500 pt-4">
        {/* Subject & Filters */}
      <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-primary" />
              Select Subject
            </Label>
            <SubjectSearchableSelect
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              placeholder="Choose a subject to enter marks"
              triggerClassName="h-12 rounded-xl bg-white border-gray-200 shadow-sm"
            />
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
                  {hasPapers ? (
                    selectedSubjectData.papers.map((paper: any) => (
                      <TableHead key={paper.id} className="w-[150px] font-semibold text-gray-900 text-center">
                        {paper.name} ({paper.max_score})
                      </TableHead>
                    ))
                  ) : (
                    <TableHead className="w-[150px] font-semibold text-gray-900 text-center">Score (100%)</TableHead>
                  )}
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
                      
                      {hasPapers ? (
                        selectedSubjectData.papers.map((paper: any) => (
                          <TableCell key={paper.id}>
                            <Input 
                              type="number" 
                              min="0" 
                              max={paper.max_score}
                              placeholder="0.0"
                              className="h-10 text-center font-bold text-primary bg-primary/5 border-primary/10 focus:ring-primary rounded-lg"
                              value={student.papers?.[paper.id] ?? ''}
                              onChange={(e) => handleScoreChange(student.student_id, e.target.value, paper.id.toString())}
                            />
                          </TableCell>
                        ))
                      ) : (
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            placeholder="0.0"
                            className="h-10 text-center font-bold text-primary bg-primary/5 border-primary/10 focus:ring-primary rounded-lg"
                            value={student.score === null ? '' : student.score}
                            onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                          />
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <Input 
                          placeholder="Optional remarks..."
                          className="h-10 rounded-lg border-gray-100 focus:ring-primary"
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
    </MainLayout>
  );
}
