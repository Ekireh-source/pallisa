'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  UserCheck,
  BookOpen,
  FolderOpen,
  Award,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import {
  Card,
  Avatar,
  AvatarFallback
} from '@/components/ui';
import { FetchTerms } from '@/features/members/members.service';

interface TeachersDashboardProps {
  user: any;
  school: any;
  onSwitchView?: () => void;
  showAdminToggle?: boolean;
}

export default function TeachersDashboard({
  user,
  school,
  onSwitchView,
  showAdminToggle = false
}: TeachersDashboardProps) {
  const [currentTerm, setCurrentTerm] = useState<string>("Term 2, 2026");

  useEffect(() => {
    const loadCurrentTerm = async () => {
      try {
        const res = await FetchTerms({ is_current: 'true' });
        if (res && 'results' in res && res.results && res.results.length > 0) {
          const activeTerm = res.results[0];
          const name = activeTerm.name;
          const yearName = activeTerm.academic_year_name || '';
          setCurrentTerm(yearName ? `${name}, ${yearName}` : name);
        }
      } catch (err) {
        console.error("Failed to load active term:", err);
      }
    };
    loadCurrentTerm();
  }, []);
  
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning,";
    if (hr < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  const teacherCards = [
    {
      title: "Attendance",
      description: "Daily Register",
      icon: UserCheck,
      href: "/students",
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "AOI Marks",
      description: "Activities",
      icon: BookOpen,
      href: "/activity-of-integration",
      colorClass: "bg-purple-50 text-purple-600",
    },
    {
      title: "Projects",
      description: "Competencies",
      icon: FolderOpen,
      href: "/competences/projects",
      colorClass: "bg-orange-50 text-orange-600",
    },
    {
      title: "SA Marks",
      description: "Subject Grid",
      icon: Award,
      href: "/exams/sa-assessment",
      colorClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "My Students",
      description: "Directory",
      icon: GraduationCap,
      href: "/students",
      colorClass: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Exams",
      description: "Assessments",
      icon: ClipboardList,
      href: "/exams",
      colorClass: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 relative animate-in fade-in duration-500">
      
      {/* Deep Blue Header Banner */}
      <div className="bg-gradient-to-b from-[#004aad] to-[#002f6c] text-white pt-8 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        {/* Decorative premium shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-16 -mb-16" />

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Row: Greeting, Avatar & Term Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <div>
                <p className="text-blue-100 text-[15px] font-medium tracking-wide">
                  {getGreeting()}
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-0.5">
                  {user?.value?.first_name || 'John'}
                </h1>
              </div>
              <div className="relative md:hidden">
                <Avatar className="h-12 w-12 ring-2 ring-white/20 shadow-md">
                  <AvatarFallback className="bg-white/10 text-white font-bold">
                    {user?.value?.first_name?.[0] || 'T'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Calendar Term Card / Avatar on Large Screen */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-white/15 rounded-xl text-emerald-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-base leading-snug">{currentTerm}</p>
                  <p className="text-xs text-blue-200 font-medium mt-0.5">2 Streams Assigned</p>
                </div>
              </div>

              <div className="hidden md:block relative">
                <Avatar className="h-14 w-14 ring-2 ring-white/20 shadow-md">
                  <AvatarFallback className="bg-white/10 text-white font-bold text-lg">
                    {user?.value?.first_name?.[0] || 'T'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic View Switcher (Subtle Pill Overlay - Only for Admins / Switchable roles) */}
      {showAdminToggle && onSwitchView && (
        <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10 flex justify-center md:justify-start">
          <div className="bg-white shadow-sm ring-1 ring-gray-100/50 rounded-full p-1.5 flex gap-1">
            <button
              onClick={onSwitchView}
              className="px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 bg-gradient-to-r from-blue-600 to-[#004aad] text-white shadow-md"
            >
              Teacher Mode
            </button>
            <button
              onClick={onSwitchView}
              className="px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 text-gray-500 hover:text-gray-900"
            >
              Admin Mode
            </button>
          </div>
        </div>
      )}

      {/* Grid: Responsive 2-Cols on Mobile, 3-Cols on Tablet, 4-Cols on Large Screens */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teacherCards.map((card, idx) => (
            <Link href={card.href} key={idx} className="group block">
              <Card className="p-6 border border-gray-100/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:ring-2 hover:ring-blue-500/10 transition-all duration-300 rounded-[28px] bg-white flex flex-col items-center text-center hover:scale-[1.03] active:scale-[0.98] transform">
                {/* Soft Background Circle for Icon */}
                <div className={`p-4 rounded-full ${card.colorClass} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <card.icon className="w-6 h-6" />
                </div>

                <h3 className="font-extrabold text-gray-800 text-[15px] tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  {card.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Interactive Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="h-14 w-14 rounded-full bg-[#004aad] hover:bg-[#002f6c] text-white flex items-center justify-center shadow-lg shadow-blue-900/30 hover:scale-110 active:scale-95 transition-all group">
          <Sparkles className="w-6 h-6 text-emerald-400 group-hover:animate-bounce duration-1000" />
        </button>
      </div>

    </div>
  );
}
