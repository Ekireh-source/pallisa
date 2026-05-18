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
  SelectItem
} from '@/components/ui';
import { FetchStudentById } from '@/features/members/members.service';
import { GenerateReportCards } from '@/features/reports/reports.service';
import AcademicYearSearchableSelect from '@/components/selects/academicyearsearchableselect';
import TermSearchableSelect from '@/components/selects/termsearchableselect';
import { MemberStudent } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { selectSchool } from '@/store/auth/selectors';

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
  
  const school = useSelector(selectSchool);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      const res = await FetchStudentById(id);
      if (res.success) {
        setStudent(res.data);
      } else {
        toast.error("Failed to load student details");
        router.push('/students');
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

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] md:col-span-1 rounded-3xl" />
          <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const DetailItem = ({ icon: Icon, label, value, color = "text-gray-500" }: any) => (
    <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-2xl h-12 w-12 hover:bg-white hover:shadow-md transition-all"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {student.full_name}
              </h1>
              <Badge className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                student.enrollment_status === 'enrolled' 
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              }`}>
                {student.enrollment_status}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span className="text-indigo-600 font-bold">ID: {student.student_id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{student.current_class_name} • {student.current_stream_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-6 font-bold shadow-sm hover:shadow-md transition-all gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowGenModal(true)}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Generate Report
          </Button>
          <Button className="rounded-2xl h-12 px-6 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-white hover:shadow-md transition-all">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-xl border-none ring-1 ring-gray-100">
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <Icon icon="hugeicons:task-list-done" className="w-4 h-4 mr-3 text-gray-400" />
                <span>View Attendance</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <Icon icon="hugeicons:graduation-cap" className="w-4 h-4 mr-3 text-gray-400" />
                <span>View Results</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 bg-gray-100" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-3" />
                <span>Delete Student</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Summary */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-100 p-1 ring-4 ring-white shadow-xl mb-6 flex items-center justify-center overflow-hidden">
                {student.user_profile_data?.profile_picture ? (
                  <img src={student.user_profile_data.profile_picture} alt="" className="w-full h-full object-cover rounded-[2.2rem]" />
                ) : (
                  <User className="w-16 h-16 text-indigo-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{student.full_name}</h2>
              <p className="text-gray-500 font-medium mb-6">{student.student_id}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-lg font-extrabold text-gray-900">{student.user_profile_data?.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="text-lg font-extrabold text-gray-900">{student.age || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <DetailItem icon={Mail} label="Email Address" value={student.email} color="text-blue-500" />
              <DetailItem icon={Phone} label="Phone Number" value={student.user_profile_data?.phone} color="text-emerald-500" />
              <DetailItem icon={MapPin} label="Home Address" value={student.user_profile_data?.emergency_contact_address} color="text-amber-500" />
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Emergency Contact
            </h3>
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <p className="text-sm font-bold text-indigo-900 mb-1">{student.user_profile_data?.emergency_contact || 'None Listed'}</p>
                <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest">Primary Contact</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Contact Phone</p>
                    <p className="text-sm font-bold">{student.user_profile_data?.emergency_phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Contact Email</p>
                    <p className="text-sm font-bold">{student.user_profile_data?.emergency_contact_email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-2 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100">
            <Tabs defaultValue="academic" className="w-full">
              <TabsList className="bg-transparent border-b border-gray-100 w-full justify-start h-auto p-4 gap-2">
                <TabsTrigger 
                  value="academic" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Academic Info
                </TabsTrigger>
                <TabsTrigger 
                  value="medical" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Health & Support
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Enrollment History
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="academic" className="m-0 space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={Calendar} label="Admission Date" value={student.admission_date ? format(new Date(student.admission_date), 'PPP') : 'N/A'} color="text-indigo-600" />
                    <DetailItem icon={CheckCircle2} label="Admission Number" value={student.admission_number} color="text-primary" />
                    <DetailItem icon={GraduationCap} label="Current Stream" value={`${student.current_class_name} - ${student.current_stream_name}`} color="text-amber-600" />
                    <DetailItem icon={MapPin} label="Campus" value={student.campus_name} color="text-rose-600" />
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Previous Education</h4>
                    <div className="p-6 rounded-2xl bg-gray-50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <History className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{student.previous_school || 'No previous school information recorded'}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Previous Institution</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="m-0 space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      </div>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Medical Conditions</p>
                      <p className="text-sm font-bold text-gray-900">{student.medical_conditions || 'None'}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Allergies</p>
                      <p className="text-sm font-bold text-gray-900">{student.allergies || 'None'}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Special Needs</p>
                      <p className="text-sm font-bold text-gray-900">{student.special_needs || 'None'}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-8">
                      <div className="relative pl-14">
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Currently Enrolled</p>
                          <h5 className="font-bold text-gray-900 mb-1">{student.current_class_name} • {student.current_stream_name}</h5>
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

          {/* Quick Actions / Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-none shadow-lg shadow-gray-100 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700" />
              <div className="relative z-10">
                <GraduationCap className="w-8 h-8 mb-4 opacity-80" />
                <h4 className="text-xl font-bold mb-1">Academic Performance</h4>
                <p className="text-indigo-100/80 text-sm mb-6">View detailed term reports and progress charts.</p>
                <Button variant="secondary" className="rounded-xl font-bold bg-white text-indigo-600 hover:bg-indigo-50 border-none px-6">
                  View Report Cards
                </Button>
              </div>
            </Card>
            <Card className="p-6 border-none shadow-lg shadow-gray-100 rounded-3xl bg-white ring-1 ring-gray-100 group">
              <div className="flex flex-col h-full">
                <Calendar className="w-8 h-8 mb-4 text-indigo-600 opacity-80" />
                <h4 className="text-xl font-bold mb-1 text-gray-900">Attendance Tracker</h4>
                <p className="text-gray-500 text-sm mb-6">Check presence, absence, and late marks for this student.</p>
                <Button variant="outline" className="rounded-xl font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50 mt-auto px-6 h-10 self-start">
                  Check Attendance
                </Button>
              </div>
            </Card>
          </div>
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
    </div>
  );
}
