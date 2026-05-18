'use client';

import React, { useEffect, useState, use } from 'react';
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
  GraduationCap
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
  DropdownMenuSeparator
} from '@/components/ui';
import { FetchTeacherById } from '@/features/members/members.service';
import { TeacherDetail } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TeacherDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
                {teacher.full_name || `${teacher.user_profile_data?.first_name} ${teacher.user_profile_data?.last_name}`}
              </h1>
              <Badge className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                teacher.is_active 
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
              }`}>
                {teacher.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {teacher.user_profile_data?.role && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                  {teacher.user_profile_data.role.name}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span className="text-indigo-600 font-bold">Code: {teacher.employee_id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{teacher.employment_type.replace('_', ' ')}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{teacher.school_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            className="rounded-2xl h-12 px-6 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all gap-2"
            onClick={() => router.push(`/teachers/${id}/edit`)}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-white hover:shadow-md transition-all">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-xl border-none ring-1 ring-gray-100">
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <History className="w-4 h-4 mr-3 text-gray-400" />
                <span>View Attendance</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                <BookOpen className="w-4 h-4 mr-3 text-gray-400" />
                <span>Assigned Subjects</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 bg-gray-100" />
              <DropdownMenuItem className="rounded-xl p-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                <Trash2 className="w-4 h-4 mr-3" />
                <span>Deactivate Teacher</span>
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
                {teacher.user_profile_data?.profile_picture ? (
                  <img src={teacher.user_profile_data.profile_picture} alt="" className="w-full h-full object-cover rounded-[2.2rem]" />
                ) : (
                  <User className="w-16 h-16 text-indigo-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {teacher.user_profile_data?.first_name} {teacher.user_profile_data?.last_name}
              </h2>
              <p className="text-gray-500 font-medium mb-6">{teacher.employee_id}</p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-lg font-extrabold text-gray-900">{teacher.user_profile_data?.gender === 'M' ? 'Male' : teacher.user_profile_data?.gender === 'F' ? 'Female' : 'Other'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                  <p className="text-lg font-extrabold text-gray-900">{teacher.years_of_experience || '0'} Yrs</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <DetailItem icon={Mail} label="Email Address" value={teacher.email} color="text-blue-500" />
              <DetailItem icon={Phone} label="Phone Number" value={teacher.user_profile_data?.phone} color="text-emerald-500" />
              <DetailItem icon={MapPin} label="Home Address" value={teacher.user_profile_data?.emergency_contact_address} color="text-amber-500" />
            </div>
          </Card>

          <Card className="p-8 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Emergency Contact
            </h3>
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <p className="text-sm font-bold text-indigo-900 mb-1">{teacher.user_profile_data?.emergency_contact || 'None Listed'}</p>
                <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest">Primary Contact</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Contact Phone</p>
                    <p className="text-sm font-bold">{teacher.user_profile_data?.emergency_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-2 border-none shadow-xl shadow-gray-200/50 rounded-[32px] ring-1 ring-gray-100">
            <Tabs defaultValue="professional" className="w-full">
              <TabsList className="bg-transparent border-b border-gray-100 w-full justify-start h-auto p-4 gap-2">
                <TabsTrigger 
                  value="professional" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Professional Info
                </TabsTrigger>
                <TabsTrigger 
                  value="assignments" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Teaching Load
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Employment History
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="professional" className="m-0 space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem icon={Calendar} label="Hire Date" value={teacher.hire_date ? format(new Date(teacher.hire_date), 'PPP') : 'N/A'} color="text-indigo-600" />
                    <DetailItem icon={BadgeCheck} label="Employee ID" value={teacher.employee_id} color="text-primary" />
                    <DetailItem icon={ShieldAlert} label="System Role" value={teacher.user_profile_data?.role?.name || 'No Role Assigned'} color="text-emerald-600" />
                    <DetailItem icon={Award} label="Qualification" value={teacher.qualification} color="text-amber-600" />
                    <DetailItem icon={Briefcase} label="Specialization" value={teacher.specialization} color="text-rose-600" />
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Previous Experience</h4>
                    <div className="p-6 rounded-2xl bg-gray-50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <History className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{teacher.previous_experience || 'No previous experience recorded'}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Professional Background</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="m-0 space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teacher.subject_assignments?.length > 0 ? (
                      teacher.subject_assignments.map((assign: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{assign.subject_name}</p>
                              <p className="text-xs text-gray-500">{assign.stream_name}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full bg-white">Primary</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-12 text-center rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No subjects assigned yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-8">
                      <div className="relative pl-14">
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Active Employment</p>
                          <h5 className="font-bold text-gray-900 mb-1">{teacher.employment_type.replace('_', ' ')}</h5>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-none shadow-lg shadow-gray-100 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700" />
              <div className="relative z-10">
                <GraduationCap className="w-8 h-8 mb-4 opacity-80" />
                <h4 className="text-xl font-bold mb-1">Assigned Classes</h4>
                <p className="text-indigo-100/80 text-sm mb-6">Manage streams and class level responsibilities.</p>
                <div className="flex -space-x-3 mb-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-indigo-700 flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold border-2 border-indigo-700">
                    +2
                  </div>
                </div>
                <Button variant="secondary" className="rounded-xl font-bold bg-white text-indigo-600 hover:bg-indigo-50 border-none px-6">
                  Manage Classes
                </Button>
              </div>
            </Card>
            <Card className="p-6 border-none shadow-lg shadow-gray-100 rounded-3xl bg-white ring-1 ring-gray-100 group">
              <div className="flex flex-col h-full">
                <Calendar className="w-8 h-8 mb-4 text-indigo-600 opacity-80" />
                <h4 className="text-xl font-bold mb-1 text-gray-900">Attendance Tracker</h4>
                <p className="text-gray-500 text-sm mb-6">Monitor attendance logs and biometric sign-ins.</p>
                <Button variant="outline" className="rounded-xl font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50 mt-auto px-6 h-10 self-start">
                  Check Attendance
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
