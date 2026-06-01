'use client';

import React, { useEffect, useState, use } from 'react';
import { Icon } from '@iconify/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  ShieldAlert, 
  Award,
  History,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  BadgeCheck,
  MoreVertical,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  UserPlus
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
  Label
} from '@/components/ui';
import { FetchTeacherById, DeleteTeacherSubjectAssignment } from '@/features/members/members.service';
import { TeacherDetail } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AssignTeachingLoadModal } from './AssignTeachingLoadModal';
import { MainLayout } from '@/components/layout/main-layout';
import Link from 'next/link';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TeacherDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("professional");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadTeacher = async () => {
    setLoading(true);
    const res = await FetchTeacherById(id);
    if (res.success) {
      setTeacher(res.data);
    } else {
      toast.error("Failed to load teacher details");
      router.push('/teachers');
    }
    setLoading(false);
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (confirm("Are you sure you want to remove this teaching assignment?")) {
      try {
        const res = await DeleteTeacherSubjectAssignment(assignmentId);
        if (res.success) {
          toast.success("Teaching assignment removed successfully");
          loadTeacher();
        } else {
          toast.error("Failed to remove teaching assignment");
        }
      } catch (error) {
        toast.error("An error occurred while removing the assignment");
      }
    }
  };

  useEffect(() => {
    loadTeacher();
  }, [id, router]);

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

  if (!teacher) return null;

  const DetailItem = ({ icon: Icon, label, value, color = "text-gray-500" }: any) => (
    <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-xl bg-white ring-1 ring-gray-100 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_TEACHERS}>
      <MainLayout
        title={teacher.full_name || `${teacher.user_profile_data?.first_name} ${teacher.user_profile_data?.last_name}`}
        description={`Employee ID: ${teacher.employee_id} • ${teacher.employment_type?.replace('_', ' ') || ''} • ${teacher.school_name || ''}`}
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
          <div className="flex items-center gap-3">
            <Button 
              className="rounded-xl h-11 px-6 font-bold bg-white text-primary hover:bg-gray-100 hover:text-primary shadow-lg transition-all gap-2"
              onClick={() => router.push(`/teachers/${id}/edit`)}
            >
              <Edit className="w-4 h-4 text-primary" />
              Edit Profile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all">
                  <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-xl border-none ring-1 ring-gray-100 bg-white">
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer" onClick={() => setActiveTab('assignments')}>
                  <Icon icon="hugeicons:task-list-done" className="w-4 h-4 mr-3 text-gray-400" />
                  <span>View Teaching Load</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer" onClick={() => setActiveTab('history')}>
                  <Icon icon="hugeicons:clock-01" className="w-4 h-4 mr-3 text-gray-400" />
                  <span>Employment History</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-gray-100" />
                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                  <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-3" />
                  <span>Deactivate Teacher</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                  {teacher.user_profile_data?.profile_picture ? (
                    <img src={teacher.user_profile_data.profile_picture} alt="" className="w-full h-full object-cover rounded-[1.8rem]" />
                  ) : (
                    <User className="w-12 h-12 text-indigo-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {teacher.full_name || `${teacher.user_profile_data?.first_name} ${teacher.user_profile_data?.last_name}`}
                    </h2>
                    <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none ${
                      teacher.is_active 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                        : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    }`}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {teacher.user_profile_data?.role && (
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border-none ring-1 ring-indigo-100">
                        {teacher.user_profile_data.role.name}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-500 font-medium text-sm flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
                    <span className="text-indigo-600 font-bold">Employee ID: {teacher.employee_id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:inline" />
                    <span className="text-gray-700 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-full text-xs">{teacher.employment_type?.replace('_', ' ') || ''}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:inline" />
                    <span className="text-gray-600 font-semibold">{teacher.school_name || ''}</span>
                  </p>
                </div>
              </div>

              {/* Right Sleek Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto shrink-0">
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-base font-extrabold text-gray-900">{teacher.user_profile_data?.gender === 'M' ? 'Male' : teacher.user_profile_data?.gender === 'F' ? 'Female' : 'Other'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                  <p className="text-base font-extrabold text-gray-900">{teacher.years_of_experience || '0'} Yrs</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Specialization</p>
                  <p className="text-base font-extrabold text-gray-900 truncate max-w-[100px]">{teacher.specialization || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-center min-w-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hire Date</p>
                  <p className="text-base font-extrabold text-gray-900 truncate max-w-[100px]">
                    {teacher.hire_date ? format(new Date(teacher.hire_date), 'MMM yyyy') : 'N/A'}
                  </p>
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
                    value="professional" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:teacher" className="w-4 h-4" />
                    Professional & Personal Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assignments" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:book-open-01" className="w-4 h-4" />
                    Teaching Load & Classes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Icon icon="hugeicons:clock-01" className="w-4 h-4" />
                    Employment History
                  </TabsTrigger>
                </TabsList>

                <div className="p-8">
                  {/* TAB 1: PROFESSIONAL & PERSONAL DETAILS */}
                  <TabsContent value="professional" className="m-0 space-y-8 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Employment Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DetailItem icon={Calendar} label="Hire Date" value={teacher.hire_date ? format(new Date(teacher.hire_date), 'PPP') : 'N/A'} color="text-indigo-600" />
                          <DetailItem icon={BadgeCheck} label="Employee ID" value={teacher.employee_id} color="text-primary" />
                          <DetailItem icon={ShieldAlert} label="System Role" value={teacher.user_profile_data?.role?.name || 'No Role Assigned'} color="text-emerald-600" />
                          <DetailItem icon={Award} label="Qualification" value={teacher.qualification} color="text-amber-600" />
                          <DetailItem icon={Briefcase} label="Specialization" value={teacher.specialization} color="text-rose-600" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Details & Biography</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DetailItem icon={Mail} label="Email Address" value={teacher.email} color="text-blue-500" />
                          <DetailItem icon={Phone} label="Phone Number" value={teacher.user_profile_data?.phone} color="text-emerald-500" />
                          <DetailItem icon={MapPin} label="Home Address" value={teacher.user_profile_data?.emergency_contact_address} color="text-amber-500" />
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
                          <p className="text-sm font-bold text-indigo-900 mb-1">{teacher.user_profile_data?.emergency_contact || 'None Listed'}</p>
                          <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">Primary Contact Name</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-sm font-bold text-gray-900 mb-1">{teacher.user_profile_data?.emergency_phone || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emergency Phone</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: TEACHING LOAD & ASSIGNMENTS */}
                  <TabsContent value="assignments" className="m-0 space-y-6 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Teaching Assignments & Subject Loads</h4>
                        <p className="text-xs font-semibold text-gray-500 mt-1">Manage class streams and subject areas allocated to {teacher.full_name}.</p>
                      </div>
                      
                      <Button 
                        onClick={() => setIsAssignModalOpen(true)}
                        className="rounded-xl px-6 h-11 bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 flex items-center gap-2 self-start sm:self-auto shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign Subject
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {teacher.subject_assignments?.length > 0 ? (
                        teacher.subject_assignments.map((assign: any, idx: number) => (
                          <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{assign.subject_name}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                                  {assign.class_name ? `${assign.class_name} - ` : ''}{assign.stream_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="rounded-full bg-white px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-indigo-600 ring-1 ring-indigo-50 border-none">Primary</Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                onClick={() => handleDeleteAssignment(assign.id)}
                                title="Delete load"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-16 text-center rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                          <h5 className="font-bold text-gray-750 mb-1">No Subjects Allocated</h5>
                          <p className="text-gray-500 font-medium text-xs mb-6">Allocate classes and subject load to start tracking term performances.</p>
                          <Button 
                            variant="outline"
                            onClick={() => setIsAssignModalOpen(true)}
                            className="rounded-xl font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50 px-6"
                          >
                            Assign First Load
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 3: EMPLOYMENT HISTORY */}
                  <TabsContent value="history" className="m-0 animate-in fade-in duration-500 focus-visible:outline-none">
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
                      <div className="space-y-8">
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Active Employment</p>
                            <h5 className="font-bold text-gray-900 mb-1">{teacher.employment_type?.replace('_', ' ') || ''}</h5>
                            <p className="text-sm text-gray-500">Working at {teacher.school_name} since {teacher.hire_date ? format(new Date(teacher.hire_date), 'PPP') : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="relative pl-14">
                          <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-gray-300 ring-4 ring-white" />
                          <div className="p-6 rounded-2xl bg-white ring-1 ring-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Record Created</p>
                            <p className="text-sm font-medium text-gray-500">Initial registration on {format(new Date(teacher.created_at), 'PPP')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          <AssignTeachingLoadModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            teacherId={id as string}
            onSuccess={loadTeacher}
          />
        </div>
      </MainLayout>
    </ProtectedComponent>
  );
}
