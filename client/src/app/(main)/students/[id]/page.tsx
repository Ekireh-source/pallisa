'use client';

import React, { useEffect, useState, use } from 'react';
import { Icon } from '@iconify/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  ShieldAlert, 
  Stethoscope, 
  History,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Printer
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Badge, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label
} from '@/components/ui';
import { FetchStudentById, DeleteStudent } from '@/features/members/members.service';
import { GenerateReportCards, FetchReportCards } from '@/features/reports/reports.service';
import { ResponsiveHeaderActions } from '@/components/layout/ResponsiveHeaderActions';
import AcademicYearSearchableSelect from '@/components/selects/academicyearsearchableselect';
import TermSearchableSelect from '@/components/selects/termsearchableselect';
import { MemberStudent } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectSchool } from '@/store/auth/selectors';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<MemberStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("marks");
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [selectedReportCardId, setSelectedReportCardId] = useState<string>("");
  
  const school = useSelector(selectSchool);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      const [res, rcRes] = await Promise.all([
        FetchStudentById(id),
        FetchReportCards({ student_id: id, student: id })
      ]);

      if (res.success) {
        setStudent(res.data);
      } else {
        toast.error("Failed to load student details");
        router.push('/students');
      }

      if (rcRes.success && rcRes.data) {
        const results = rcRes.data.results || rcRes.data;
        setReportCards(results);
        if (results && results.length > 0) {
          setSelectedReportCardId(String(results[0].id));
        }
      }
      setLoading(false);
    };

    loadStudent();
  }, [id, router]);

  useEffect(() => {
    setSelectedTerm('');
  }, [selectedYear]);

  const handleGenerate = async () => {
    if (!selectedYear || !selectedTerm) {
      toast.error("Please select both academic year and term");
      return;
    }

    setGenerating(true);
    const res = await GenerateReportCards({
      academic_year: parseInt(selectedYear),
      term: parseInt(selectedTerm),
      student: parseInt(id),
      school: school?.id
    });

    if (res.success) {
      toast.success("Report card generated successfully");
      setShowGenModal(false);
      // Navigate to the generated report card for this student
      const results = res.data?.results;
      if (results && results.length > 0) {
        // Fetch the report card ID from the list endpoint
        router.push(`/reports?student_id=${id}&term=${selectedTerm}&academic_year=${selectedYear}`);
      }
    } else {
      toast.error("Failed to generate report card");
    }
    setGenerating(false);
  };
 
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this student?")) {
      const result = await DeleteStudent(parseInt(id));
      if (result.success) {
        toast.success("Student deleted successfully");
        router.push("/students");
      } else {
        toast.error("Failed to delete student");
      }
    }
  };

  if (loading) {
    return (
      <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_STUDENTS}>
        <MainLayout
          title="Student Profile"
          description="Loading details..."
          backButton={
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          }
        >
          <div className="space-y-8 animate-in fade-in duration-500 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Skeleton className="h-[400px] md:col-span-1 rounded-3xl" />
              <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
            </div>
          </div>
        </MainLayout>
      </ProtectedComponent>
    );
  }

  if (!student) return null;

  const activeReportCard = reportCards.find(rc => String(rc.id) === String(selectedReportCardId)) || reportCards[0];

  const getGradeColor = (grade: string) => {
    if (!grade) return "bg-gray-100 text-gray-800 ring-gray-200";
    const g = grade.toUpperCase();
    if (g.startsWith('D') || g === 'A' || g === 'B') {
      return "bg-emerald-50 text-emerald-700 ring-emerald-200 border-none";
    }
    if (g.startsWith('C') || g === 'C' || g === 'D' || g === 'E') {
      return "bg-blue-50 text-blue-700 ring-blue-200 border-none";
    }
    if (g.startsWith('P') || g === 'O') {
      return "bg-amber-50 text-amber-700 ring-amber-200 border-none";
    }
    return "bg-rose-50 text-rose-700 ring-rose-200 border-none";
  };

  const DetailItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-100">
      <div className="p-2.5 rounded-xl bg-primary/5 text-primary border border-primary/10 shadow-sm flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_STUDENTS}>
      <MainLayout
        title={student.full_name}
        description={`ID: ${student.student_id} • ${student.class_name || ''} • ${student.current_stream_name || ''}`}
        backButton={
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
        headerActions={
          <ResponsiveHeaderActions
            primary={{
              label: "Edit Profile",
              icon: <Edit className="w-4 h-4 text-primary" />,
              href: `/students/${id}/edit`,
            }}
            secondary={[
              {
                label: "Generate Report",
                icon: generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />,
                onClick: () => setShowGenModal(true),
              },
              {
                label: "Delete Student",
                icon: <Trash2 className="w-4 h-4" />,
                onClick: handleDelete,
                variant: "danger",
              },
            ]}
          />
        }
      >
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">
          
          {/* PROFILE HERO CARD - Important Info at the Top */}
          <Card className="p-8 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100 overflow-hidden relative group bg-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110 duration-700 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Profile Summary */}
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full lg:w-auto">
                <div className="w-28 h-28 rounded-[2rem] bg-indigo-100 p-1 ring-4 ring-indigo-50 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                  {student.user_profile_data?.profile_picture ? (
                    <img src={student.user_profile_data.profile_picture} alt="" className="w-full h-full object-cover rounded-[1.8rem]" />
                  ) : (
                    <User className="w-12 h-12 text-indigo-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{student.full_name}</h2>
                    <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none ${
                      student.enrollment_status === 'enrolled' 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}>
                      {student.enrollment_status}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-500 font-medium text-sm flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
                    <span className="text-indigo-600 font-bold">ID: {student.student_id}</span>
                    {student.lin && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:inline" />
                        <span className="text-emerald-600 font-bold">LIN: {student.lin}</span>
                      </>
                    )}
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:inline" />
                    <span className="text-gray-700 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-full text-xs">{student.class_name} • {student.current_stream_name}</span>
                  </p>
                </div>
              </div>

              {/* Right Sleek Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto shrink-0">
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-base font-extrabold text-gray-900">{student.user_profile_data?.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="text-base font-extrabold text-gray-900">{student.age || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stream</p>
                  <p className="text-base font-extrabold text-gray-900 truncate max-w-[100px]">{student.current_stream_name || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admission No</p>
                  <p className="text-base font-extrabold text-gray-900 truncate max-w-[100px]">{student.admission_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* FULL-WIDTH TABS AT THE BOTTOM */}
          <div className="w-full space-y-6">
            <Card className="p-2 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100 bg-white">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b border-gray-100 w-full justify-start h-auto p-4 gap-2 overflow-x-auto flex-wrap">
                  <TabsTrigger 
                    value="marks" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:graduation-cap" className="w-4 h-4" />
                    Student Marks & Results
                  </TabsTrigger>
                  <TabsTrigger 
                    value="academic" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:task-list-done" className="w-4 h-4" />
                    Academic & Personal Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="medical" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:stethoscope" className="w-4 h-4" />
                    Health & Support
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:clock-01" className="w-4 h-4" />
                    Enrollment History
                  </TabsTrigger>
                </TabsList>

                <div className="p-8">
                  {/* TAB 1: STUDENT MARKS & RESULTS */}
                  <TabsContent value="marks" className="m-0 space-y-8 animate-in fade-in duration-500 focus-visible:outline-none">
                    {reportCards && reportCards.length > 0 ? (
                      <div className="space-y-6">
                        {/* Selector/Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">Term Progress & Subject Scores</h4>
                            <p className="text-xs font-semibold text-gray-500 mt-1">Select an active term report card to view detailed results.</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Label className="text-sm font-bold text-gray-700 shrink-0 hidden sm:inline">Active Report:</Label>
                            <Select value={selectedReportCardId} onValueChange={setSelectedReportCardId}>
                              <SelectTrigger className="w-[260px] h-11 rounded-xl bg-white border-gray-200 font-bold text-gray-700 shadow-sm">
                                <SelectValue placeholder="Select Term Report" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl p-1">
                                {reportCards.map((rc: any) => (
                                  <SelectItem key={rc.id} value={String(rc.id)} className="rounded-lg font-medium">
                                    {rc.academic_year_name} - {rc.term_name} ({rc.class_name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Subject Marks Table */}
                        {activeReportCard && (
                          <div className="space-y-6">
                            <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
                              <table className="min-w-full divide-y divide-gray-100 bg-white">
                                <thead className="bg-gray-50/50">
                                  <tr>
                                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Subject Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Continuous Assessment (CA)</th>
                                    <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Exam Score</th>
                                    <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Final Grade</th>
                                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Remarks</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {activeReportCard.subject_reports && activeReportCard.subject_reports.length > 0 ? (
                                    activeReportCard.subject_reports.map((sr: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                              <Icon icon="hugeicons:book-open-01" className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-bold text-gray-900">{sr.subject_name}</p>
                                              <p className="text-[10px] text-gray-400 font-semibold">{sr.subject_code || '—'}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                                          {sr.aoi_score !== null && sr.aoi_score !== undefined ? `${sr.aoi_score}/20` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                                          {sr.exam_score !== null && sr.exam_score !== undefined ? `${sr.exam_score}/80` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <Badge className={`rounded-xl px-2.5 py-1 text-xs font-black ring-1 uppercase tracking-wider ${getGradeColor(sr.grade)}`}>
                                            {sr.grade || '—'}
                                          </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                          {sr.remarks || '—'}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic text-sm">
                                        No subject scores recorded on this report card.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary Performance Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                              <Card className="p-5 border-none bg-indigo-50/50 border border-indigo-100 flex items-center gap-4 rounded-2xl">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                  <Icon icon="hugeicons:analytics-up" className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Average</p>
                                  <p className="text-xl font-extrabold text-indigo-900 mt-0.5">
                                    {activeReportCard.average_score ? `${Number(activeReportCard.average_score).toFixed(1)}%` : '—'}
                                  </p>
                                </div>
                              </Card>

                              <Card className="p-5 border-none bg-emerald-50/50 border border-emerald-100 flex items-center gap-4 rounded-2xl">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                                  <Icon icon="hugeicons:award-02" className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-black">Grade / Aggregate</p>
                                  <p className="text-xl font-extrabold text-emerald-900 mt-0.5">
                                    {activeReportCard.aggregate || activeReportCard.division || '—'}
                                  </p>
                                </div>
                              </Card>

                              <Button 
                                variant="outline"
                                className="h-full rounded-2xl border-indigo-100 hover:bg-indigo-50 text-indigo-600 font-bold p-5 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                onClick={() => router.push(`/reports/${activeReportCard.id}`)}
                              >
                                <Printer className="w-5 h-5" />
                                View Full Printable Report
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Empty State for results */
                      <div className="flex flex-col items-center justify-center py-16 text-center w-full">
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 ring-8 ring-indigo-50/40">
                          <Icon icon="hugeicons:graduation-cap" className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">No Results Recorded Yet</h4>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                          This student has no report cards generated for this academic year. Create their term record to track subjects and exam scores.
                        </p>
                        <Button 
                          onClick={() => setShowGenModal(true)}
                          className="rounded-xl px-6 h-11 bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          Generate Report Card
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: ACADEMIC & PERSONAL DETAILS */}
                  <TabsContent value="academic" className="m-0 space-y-8 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Enrollment Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DetailItem icon={Calendar} label="Admission Date" value={student.admission_date ? format(new Date(student.admission_date), 'PPP') : 'N/A'} />
                          <DetailItem icon={CheckCircle2} label="Admission Number" value={student.admission_number} />
                          <DetailItem icon={CheckCircle2} label="LIN" value={student.lin} />
                          <DetailItem icon={GraduationCap} label="Current Stream" value={`${student.class_name} - ${student.current_stream_name}`} />
                        </div>
                      </div>
 
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Info & Previous Education</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DetailItem icon={Mail} label="Email Address" value={student.email} />
                          <DetailItem icon={Phone} label="Phone Number" value={student.user_profile_data?.phone} />
                          <DetailItem icon={History} label="Previous School" value={student.previous_school} />
                          <DetailItem icon={MapPin} label="Home Address" value={student.user_profile_data?.emergency_contact_address} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                      <h3 className="text-base font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        Emergency Contact Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                          <p className="text-sm font-bold text-indigo-900 mb-1">{student.user_profile_data?.emergency_contact || 'None Listed'}</p>
                          <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">Primary Contact Name</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-sm font-bold text-gray-900 mb-1">{student.user_profile_data?.emergency_phone || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emergency Phone</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-sm font-bold text-gray-900 mb-1">{student.user_profile_data?.emergency_contact_email || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emergency Email</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: HEALTH & MEDICAL */}
                  <TabsContent value="medical" className="m-0 space-y-8 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Medical Conditions</p>
                        <p className="text-sm font-bold text-gray-900">{student.medical_conditions || 'None Listed'}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Allergies</p>
                        <p className="text-sm font-bold text-gray-900">{student.allergies || 'None Listed'}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Special Needs</p>
                        <p className="text-sm font-bold text-gray-900">{student.special_needs || 'None Listed'}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 4: ENROLLMENT HISTORY */}
                  <TabsContent value="history" className="m-0 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
                      <div className="space-y-8">
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Currently Enrolled</p>
                            <h5 className="font-bold text-gray-900 mb-1">{student.class_name} • {student.current_stream_name}</h5>
                            <p className="text-sm text-gray-500">Active since admission on {student.admission_date ? format(new Date(student.admission_date), 'PPP') : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white" />
                          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Account Created</p>
                            <p className="text-sm font-medium text-gray-500">Initial registration on {format(new Date(student.created_at), 'PPP')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

        </div>

      <Dialog open={showGenModal} onOpenChange={setShowGenModal}>
        <DialogContent className="rounded-[32px] p-8 border-none shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-gray-900 mb-2">Generate Report Card</DialogTitle>
            <p className="text-gray-500 font-medium">Select the academic period for {student.full_name}'s report card.</p>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Academic Year</label>
              <AcademicYearSearchableSelect
                value={selectedYear}
                onValueChange={setSelectedYear}
                placeholder="Select Year"
                triggerClassName="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-indigo-500 font-bold text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Term</label>
              <TermSearchableSelect
                value={selectedTerm}
                onValueChange={setSelectedTerm}
                academicYearId={selectedYear}
                disabled={!selectedYear}
                placeholder="Select Term"
                triggerClassName="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-indigo-500 font-bold text-gray-900"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:justify-between">
            <Button variant="ghost" onClick={() => setShowGenModal(false)} className="rounded-2xl h-12 px-6 font-bold">
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="rounded-2xl h-12 px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all min-w-[160px]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  </ProtectedComponent>
  );
}
