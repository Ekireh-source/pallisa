'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Save, 
  TrendingUp, 
  BookOpen, 
  Users,
  Search,
  Upload,
  Download,
  Loader2,
  HelpCircle,
  Percent,
  Sparkles
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
  Skeleton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui';
import { FetchSaAssessmentById, FetchSaAssessmentStudentScores, SaveBulkSaAssessmentScores } from '@/features/exam/exam.service';
import { toast } from 'sonner';

export default function SaAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [assessmentRes, scoresRes] = await Promise.all([
        FetchSaAssessmentById(id),
        FetchSaAssessmentStudentScores(id)
      ]);

      if (assessmentRes.success) {
        setAssessment(assessmentRes.data);
      } else {
        toast.error("Failed to load Summative Assessment details");
      }

      if (scoresRes.success) {
        setStudents(scoresRes.data);
      } else {
        toast.error("Failed to load student evaluation records");
      }
      
      setLoading(false);
    };

    loadInitialData();
  }, [id]);

  const handleCellChange = (studentId: number, field: string, value: string) => {
    setStudents(prev => prev.map(student => {
      if (student.student_id === studentId) {
        return {
          ...student,
          [field]: value === '' ? null : parseFloat(value)
        };
      }
      return student;
    }));
  };

  const calculateStudentSum = (student: any) => {
    const fields = ['l1', 'g1', 'l2', 'g2', 'l3', 'g3', 'l4', 'g4', 'l5', 'g5'];
    let sum = 0;
    let hasValue = false;
    fields.forEach(f => {
      if (student[f] !== null && student[f] !== undefined) {
        sum += student[f];
        hasValue = true;
      }
    });
    return hasValue ? sum : null;
  };

  const calculateStudentPercentage = (student: any) => {
    const sum = calculateStudentSum(student);
    const totalBox = parseFloat(assessment?.total_box || 10.00);
    if (sum === null || totalBox <= 0) return null;
    return (sum / totalBox) * 100;
  };

  const getPercentageBadge = (pct: number | null) => {
    if (pct === null) return <span className="text-gray-400 font-semibold text-xs">Ungraded</span>;
    
    const formatted = pct.toFixed(1);
    if (pct >= 75) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold rounded-full px-3 py-1 flex items-center justify-center gap-1 w-20">
          {formatted}%
        </Badge>
      );
    } else if (pct >= 50) {
      return (
        <Badge className="bg-blue-50 text-indigo-700 hover:bg-blue-50 border-none font-bold rounded-full px-3 py-1 flex items-center justify-center gap-1 w-20">
          {formatted}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-none font-bold rounded-full px-3 py-1 flex items-center justify-center gap-1 w-20">
          {formatted}%
        </Badge>
      );
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const payload = {
      records: students.map(s => ({
        student_id: s.student_id,
        l1: s.l1, g1: s.g1,
        l2: s.l2, g2: s.g2,
        l3: s.l3, g3: s.g3,
        l4: s.l4, g4: s.g4,
        l5: s.l5, g5: s.g5,
      }))
    };

    const result = await SaveBulkSaAssessmentScores(id, payload);
    if (result.success) {
      toast.success("SA evaluation marks saved successfully");
      const scoresRes = await FetchSaAssessmentStudentScores(id);
      if (scoresRes.success) setStudents(scoresRes.data);
    } else {
      toast.error("Failed to save scores");
    }
    setSaving(false);
  };

  const downloadTemplate = () => {
    const columns = ["AdmissionNumber", "L1", "G1", "L2", "G2", "L3", "G3", "L4", "G4", "L5", "G5"];
    const header = columns.join(",");
    const rows = students.map(s => {
      const parts = [s.admission_number];
      const fields = ["l1", "g1", "l2", "g2", "l3", "g3", "l4", "g4", "l5", "g5"];
      fields.forEach(f => parts.push(s[f] ?? ""));
      return parts.join(",");
    }).join("\n");

    const blob = new Blob([header + "\n" + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SA_${assessment?.subject_code || 'assessment'}_Template.csv`;
    a.click();
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const admissionIndex = headers.indexOf("AdmissionNumber");
      
      if (admissionIndex === -1) {
        toast.error("Invalid CSV format. Missing 'AdmissionNumber' column.");
        return;
      }

      const parsedData: { [admNo: string]: any } = {};
      const fields = ["L1", "G1", "L2", "G2", "L3", "G3", "L4", "G4", "L5", "G5"];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const parts = lines[i].split(',').map(p => p.trim());
        const admNo = parts[admissionIndex];
        
        if (!admNo) continue;
        parsedData[admNo] = {};

        fields.forEach(field => {
          const colIndex = headers.indexOf(field);
          if (colIndex !== -1) {
            const val = parseFloat(parts[colIndex]);
            parsedData[admNo][field.toLowerCase()] = isNaN(val) ? null : val;
          }
        });
      }

      setStudents(prev => prev.map(student => {
        const uploadValues = parsedData[student.admission_number];
        if (uploadValues) {
          return {
            ...student,
            ...uploadValues
          };
        }
        return student;
      }));

      toast.success("CSV spreadsheet data applied. Click 'Save SA Matrix' to persist changes.");
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
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
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-500 p-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0 rounded-full border-gray-200"
              onClick={() => router.push('/exams/sa-assessment')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{assessment?.subject_name}</h1>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold rounded-full px-3 py-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>SA Assessment Detail</span>
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-gray-500 text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Stream: {assessment?.stream_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Term: {assessment?.term_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-500" />
                  Total Box: {parseFloat(assessment?.total_box).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-11" onClick={() => router.push(`/exams/sa-assessment/${id}/edit`)}>
              Edit Settings
            </Button>
            <Button 
              className="rounded-xl h-11 bg-primary font-semibold transition-all active:scale-95 px-5"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save SA Matrix
            </Button>
          </div>
        </div>

        {/* Global Settings & Filter Configuration */}
        <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search students in this stream..." 
                className="pl-11 h-12 rounded-xl border-gray-200 bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm font-semibold" 
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2 text-gray-500" />
                Template
              </Button>
              <div className="flex-1 relative">
                <Input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  id="sa-csv-upload" 
                  onChange={handleBulkUpload}
                />
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm font-semibold" 
                  asChild
                >
                  <label htmlFor="sa-csv-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2 text-gray-500" />
                    Upload csv
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Dynamic Spreadsheet Table Ledger */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table className="min-w-max border-collapse">
              <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                <TableRow>
                  <TableHead rowSpan={2} className="font-bold text-gray-900 w-60 px-6 py-4 border-r border-gray-100">Student Info</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-900 text-center px-4 py-2 border-r border-gray-100 bg-indigo-50/20">Milestone 1</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-900 text-center px-4 py-2 border-r border-gray-100">Milestone 2</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-900 text-center px-4 py-2 border-r border-gray-100 bg-indigo-50/20">Milestone 3</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-900 text-center px-4 py-2 border-r border-gray-100">Milestone 4</TableHead>
                  <TableHead colSpan={2} className="font-bold text-gray-900 text-center px-4 py-2 border-r border-gray-100 bg-indigo-50/20">Milestone 5</TableHead>
                  <TableHead rowSpan={2} className="font-bold text-gray-900 text-center w-24 px-4 py-4 border-l border-gray-100">Sum</TableHead>
                  <TableHead rowSpan={2} className="font-bold text-gray-900 text-center w-32 px-6 py-4">Final %</TableHead>
                </TableRow>
                <TableRow className="border-b border-gray-100 bg-gray-50/20">
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 bg-indigo-50/10">L1</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 border-r border-gray-100 bg-indigo-50/10">G1</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2">L2</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 border-r border-gray-100">G2</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 bg-indigo-50/10">L3</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 border-r border-gray-100 bg-indigo-50/10">G3</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2">L4</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 border-r border-gray-100">G4</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 bg-indigo-50/10">L5</TableHead>
                  <TableHead className="font-bold text-gray-500 text-center w-14 py-2 border-r border-gray-100 bg-indigo-50/10">G5</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="h-64 text-center text-gray-500">
                      No students enrolled in this stream.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const sum = calculateStudentSum(student);
                    const percentage = calculateStudentPercentage(student);

                    return (
                      <TableRow key={student.student_id} className="hover:bg-gray-50/20 transition-colors border-b border-gray-100">
                        <TableCell className="px-6 py-3 border-r border-gray-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">{student.student_name}</span>
                            <span className="text-xs text-gray-400 font-medium">{student.admission_number}</span>
                          </div>
                        </TableCell>

                        {/* Dual-grid columns (L & G) per Milestone */}
                        {["1", "2", "3", "4", "5"].map((index, colIdx) => {
                          const lField = `l${index}`;
                          const gField = `g${index}`;
                          const isColBg = colIdx % 2 === 0;

                          return (
                            <React.Fragment key={index}>
                              <TableCell className={`p-1.5 ${isColBg ? 'bg-indigo-50/5' : ''}`}>
                                <Input 
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  placeholder="0.0"
                                  className="h-9 w-14 text-center font-semibold text-gray-800 border-gray-200 focus:border-indigo-500 rounded-lg mx-auto"
                                  value={student[lField] === null || student[lField] === undefined ? '' : student[lField]}
                                  onChange={(e) => handleCellChange(student.student_id, lField, e.target.value)}
                                />
                              </TableCell>
                              <TableCell className={`p-1.5 border-r border-gray-100 ${isColBg ? 'bg-indigo-50/5' : ''}`}>
                                <Input 
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  placeholder="0.0"
                                  className="h-9 w-14 text-center font-semibold text-gray-800 border-gray-200 focus:border-indigo-500 rounded-lg mx-auto"
                                  value={student[gField] === null || student[gField] === undefined ? '' : student[gField]}
                                  onChange={(e) => handleCellChange(student.student_id, gField, e.target.value)}
                                />
                              </TableCell>
                            </React.Fragment>
                          );
                        })}

                        {/* Live Calculated Row Aggregations */}
                        <TableCell className="text-center font-bold text-gray-900 border-l border-r border-gray-100 px-4 py-3 bg-gray-50/10">
                          {sum !== null ? sum.toFixed(1) : '-'}
                        </TableCell>

                        <TableCell className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center">
                            {getPercentageBadge(percentage)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
