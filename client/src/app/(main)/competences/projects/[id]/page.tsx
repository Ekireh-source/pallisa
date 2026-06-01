'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Save, 
  Users,
  Search,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Award
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
  Skeleton,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui';
import { FetchProjectScoreMatrixById, SaveBulkProjectScoresById } from '@/features/exam/exam.service';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

// Competency criteria mapping based on legacy timo specs
const COMPETENCY_CRITERIA: { [key: number]: string[] } = {
  1: Array.from({ length: 14 }, (_, i) => `1.${i + 1}`),
  2: Array.from({ length: 3 }, (_, i) => `2.${i + 1}`),
  3: Array.from({ length: 6 }, (_, i) => `3.${i + 1}`),
  4: Array.from({ length: 2 }, (_, i) => `4.${i + 1}`),
};

export default function ProjectMatrixGradingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [streamId, setStreamId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [competencyNumber, setCompetencyNumber] = useState<number>(1);
  const [activeCompetencies, setActiveCompetencies] = useState<number[]>([1, 2, 3, 4]);
  const [streamName, setStreamName] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to load the project matrix scores
  const loadMatrix = async (targetId: string) => {
    setLoading(true);
    const res = await FetchProjectScoreMatrixById(targetId);
    if (res.success && res.data) {
      setStudents(res.data.learners || []);
      if (res.data.active_competencies) {
        setActiveCompetencies(res.data.active_competencies);
      }
      if (res.data.stream_name) {
        setStreamName(res.data.stream_name);
      }
      if (res.data.subject_name) {
        setSubjectName(res.data.subject_name);
      }
      if (res.data.project_name) {
        setProjectName(res.data.project_name);
      }
    } else {
      toast.error("Failed to load project matrix data");
    }
    setLoading(false);
  };

  // Parse ID and Fetch scores matrix
  useEffect(() => {
    if (!id) return;
    
    const parts = id.split('-');
    if (parts.length === 3) {
      setStreamId(parseInt(parts[0]));
      setSubjectId(parseInt(parts[1]));
      setCompetencyNumber(parseInt(parts[2]));
      loadMatrix(id);
    } else {
      loadMatrix(`${id}?competency_number=${competencyNumber}`);
    }
  }, [id, competencyNumber]);

  const handleSwitchCompetency = (num: number) => {
    setCompetencyNumber(num);
    if (id && !id.includes('-')) {
      // Custom Project ID loads dynamically through useEffect dependency
    } else {
      if (!streamId || !subjectId) return;
      const newId = `${streamId}-${subjectId}-${num}`;
      router.push(`/competences/projects/${newId}`, { scroll: false });
    }
  };

  const activeCriteria = COMPETENCY_CRITERIA[competencyNumber] || [];

  // Update cell score in state
  const handleScoreChange = (studentId: number, criterion: string, value: string) => {
    setStudents(prev => prev.map(student => {
      if (student.student_id === studentId) {
        return {
          ...student,
          scores: {
            ...student.scores,
            [criterion]: value === '' ? null : parseFloat(value)
          }
        };
      }
      return student;
    }));
  };

  // Bulk save to backend
  const handleSaveMatrix = async () => {
    if (!competencyNumber) return;
    setSaving(true);

    // Format scores into records payload matching JSON Document schema
    const records = students.map(student => {
      const studentScores: { [key: string]: number | null } = {};
      activeCriteria.forEach(crit => {
        const val = student.scores?.[crit];
        if (val !== undefined && val !== null && val !== '') {
          const parsed = parseFloat(String(val));
          if (!isNaN(parsed)) {
            studentScores[crit] = parsed;
          }
        }
      });
      return {
        student_id: Number(student.student_id),
        scores: studentScores
      };
    });

    const payload = {
      competency_number: Number(competencyNumber),
      records
    };

    const res = await SaveBulkProjectScoresById(id, payload as any);
    if (res.success) {
      toast.success("Project Matrix scores saved successfully!");
    } else {
      toast.error("Failed to save matrix scores");
    }
    setSaving(false);
  };

  // Export CSV template
  const handleExportTemplate = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const headers = ['Admission Number', 'Student Name', ...activeCriteria];
    const rows = students.map(student => [
      student.admission_number || '',
      student.student_name || '',
      ...activeCriteria.map(crit => student.scores?.[crit] ?? '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Project_Matrix_C${competencyNumber}_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template exported successfully");
  };

  // Import CSV grades
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.split(','));
      if (lines.length < 2) {
        toast.error("Invalid CSV file structure");
        return;
      }

      const headers = lines[0].map(h => h.replace(/"/g, '').trim());
      
      // Map columns
      const admColIndex = headers.indexOf('Admission Number');
      const criteriaIndices: { [key: string]: number } = {};
      activeCriteria.forEach(crit => {
        criteriaIndices[crit] = headers.indexOf(crit);
      });

      if (admColIndex === -1) {
        toast.error("CSV must contain 'Admission Number' column");
        return;
      }

      let importCount = 0;
      const updatedStudents = [...students];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < headers.length) continue;

        const admNum = row[admColIndex].replace(/"/g, '').trim();
        const studentIndex = updatedStudents.findIndex(s => s.admission_number === admNum);

        if (studentIndex !== -1) {
          const studentScores = { ...(updatedStudents[studentIndex].scores || {}) };
          
          activeCriteria.forEach(crit => {
            const idx = criteriaIndices[crit];
            if (idx !== -1 && row[idx]) {
              const val = parseFloat(row[idx].replace(/"/g, '').trim());
              if (!isNaN(val) && val >= 0 && val <= 3) {
                studentScores[crit] = val;
              }
            }
          });

          updatedStudents[studentIndex].scores = studentScores;
          importCount++;
        }
      }

      setStudents(updatedStudents);
      toast.success(`Successfully imported project scores for ${importCount} students!`);
    };
    reader.readAsText(file);
  };

  // Filter learners
  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_COMPETENCES}>
    <MainLayout
      title={`Grade Project Competency Matrix (C${competencyNumber})`}
      description="Record project-based evaluation criteria scores. Value ranges between 0.00 and 3.00."
    >
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 p-0 rounded-full border-gray-200"
                onClick={() => router.push('/competences/projects')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Project Evaluation Grid</span>
                <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary animate-pulse" />
                  Competency Area {competencyNumber} Matrix
                </h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto rounded-xl border-gray-200 shadow-sm h-11 px-4 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                onClick={handleExportTemplate}
              >
                <Download className="w-4.5 h-4.5" />
                <span>Export Template</span>
              </Button>

              <label className="w-full sm:w-auto cursor-pointer">
                <div className="w-full sm:w-auto rounded-xl border border-gray-200 shadow-sm h-11 px-4 text-gray-700 font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-primary" />
                  <span>Import CSV</span>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleImportCSV}
                />
              </label>

              <Button 
                onClick={handleSaveMatrix}
                className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-bold rounded-xl h-11 px-5 shadow-md shadow-primary/20 flex items-center justify-center gap-2 min-w-32"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" />
                    <span>Save Scores</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stream, Subject & Project Info Card */}
          {(streamName || subjectName || projectName) && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{subjectName || 'Subject'}</span>
                <h2 className="font-extrabold text-gray-900 text-2xl mt-2">{projectName || 'Project Evaluation Workspace'}</h2>
                <p className="text-sm text-gray-500 font-semibold mt-1">Class Stream: <span className="text-gray-900 font-bold">{streamName || 'N/A'}</span></p>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 md:min-w-64 max-w-sm">
                <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">Lower Secondary Standards</span>
                <p className="text-xs font-medium text-amber-900 mt-1">Record criteria-level marks. Enter decimals or integers directly inside the matrix.</p>
              </div>
            </div>
          )}

          {/* Competency Tabs */}
          <div className="bg-gray-100/80 p-1.5 rounded-2xl flex gap-1 border border-gray-200/50 shadow-inner w-full md:w-fit overflow-x-auto">
            {activeCompetencies.map((num) => {
              const isActive = num === competencyNumber;
              return (
                <button
                  key={num}
                  onClick={() => handleSwitchCompetency(num)}
                  className={`flex-1 md:flex-initial text-center px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-w-20 ${
                    isActive
                      ? "bg-white text-primary shadow-sm border border-gray-100/50"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  C{num} Area
                </button>
              );
            })}
          </div>

          <Card className="p-4 border-none shadow-sm ring-1 ring-gray-100 bg-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search students by name or admission number..." 
                  className="pl-11 h-11 rounded-xl border-gray-200 focus:ring-primary w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-bold rounded-full px-3 py-1 flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>Total Students: {students.length}</span>
                </Badge>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-16">
                <FileSpreadsheet className="w-14 h-14 text-gray-200 mb-4" />
                <p className="text-lg font-bold text-gray-900">No student scores found</p>
                <p className="text-sm mt-1 text-gray-400">Ensure the stream has active students registered.</p>
              </div>
             ) : (
              <>
                {/* Desktop view: Spreadsheet Grid */}
                <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl max-h-[500px]">
                  <Table className="min-w-max">
                    <TableHeader className="bg-gray-50/55 sticky top-0 z-20 backdrop-blur-md">
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="w-24 text-left font-bold text-gray-700 py-4.5 px-4 sticky left-0 bg-gray-50/95 z-20 border-r border-gray-100">Admission No</TableHead>
                        <TableHead className="w-64 text-left font-bold text-gray-700 py-4.5 px-4 sticky left-24 bg-gray-50/95 z-20 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Student Name</TableHead>
                        
                        {activeCriteria.map((crit) => (
                          <TableHead key={crit} className="text-center font-extrabold text-gray-700 w-24">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dashed decoration-gray-300 decoration-1">
                                  {crit}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="rounded-xl border border-gray-100 shadow-xl p-3 max-w-xs font-semibold text-gray-700">
                                <p className="text-xs">Competency Criteria {crit}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Uganda Lower Secondary Curriculum Assessment Matrix</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50/30">
                          <TableCell className="font-semibold text-gray-500 py-3.5 px-4 sticky left-0 bg-white z-10 border-r border-gray-100 text-xs">
                            {student.admission_number || 'N/A'}
                          </TableCell>
                          <TableCell className="font-bold text-gray-900 py-3.5 px-4 sticky left-24 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            {student.student_name}
                          </TableCell>

                          {activeCriteria.map((crit) => {
                            const val = student.scores?.[crit] ?? '';
                            return (
                              <TableCell key={crit} className="py-2 px-2 text-center w-24">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="3"
                                  className="w-16 h-9 rounded-lg text-center font-bold border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary p-1 mx-auto bg-gray-50/50 hover:bg-white"
                                  value={val}
                                  onChange={(e) => handleScoreChange(student.student_id, crit, e.target.value)}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile view: Roster Card List */}
                <div className="block md:hidden space-y-4">
                  {filteredStudents.map((student) => (
                    <div 
                      key={student.student_id} 
                      className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm space-y-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
                        <div>
                          <h4 className="font-extrabold text-gray-950 text-base leading-tight">{student.student_name}</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                            ADM: {student.admission_number || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {activeCriteria.map((crit) => {
                          const val = student.scores?.[crit] ?? '';
                          return (
                            <div 
                              key={crit} 
                              className="flex flex-col gap-1.5 p-2 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100/50 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">Criteria {crit}</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-3 h-3 text-gray-300 cursor-pointer" />
                                  </TooltipTrigger>
                                  <TooltipContent className="rounded-xl border border-gray-100 shadow-xl p-3 max-w-xs font-semibold text-gray-700">
                                    <p className="text-xs">Criteria {crit}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Uganda Lower Secondary Curriculum Standard</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="3"
                                className="w-full h-9 rounded-lg text-center font-bold border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary p-1 bg-white"
                                value={val}
                                onChange={(e) => handleScoreChange(student.student_id, crit, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

        </div>
      </TooltipProvider>
    </MainLayout>
    </ProtectedComponent>
  );
}
