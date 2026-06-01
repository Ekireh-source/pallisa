'use client';

import React, { useEffect, useState, use } from 'react';
import { Printer, ArrowLeft, Settings2, FileDown, MoreVertical } from 'lucide-react';
import { Button, Skeleton, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import { FetchReportCardById, FetchReportCardSettings, FetchGradingSystems, DownloadReportCardPdf } from '@/features/reports/reports.service';
import { ReportCard, ReportCardSettings } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store';
import { UpdateSchool, FetchSchoolById } from '@/features/school/school.service';
import { setSchool } from '@/store/auth/actions';
import { ReportCardSettingsPanel } from '@/components/report-card/ReportCardSettingsPanel';
import { OLevelReportCard } from '@/components/report-card/OLevelReportCard';
import { ALevelReportCard } from '@/components/report-card/ALevelReportCard';
import { MainLayout } from '@/components/layout/main-layout';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';

// ─── types ────────────────────────────────────────────────────────────────────
interface GradeBoundary {
  id: number;
  grade: string;
  min_score: number;
  max_score: number;
  remarks: string;
  description: string;
}

interface GradingSystem {
  id: number;
  name: string;
  boundaries: GradeBoundary[];
}

interface PageProps { params: Promise<{ id: string }>; }

const DEFAULT_SETTINGS: Omit<ReportCardSettings, 'id' | 'school' | 'updated_at'> = {
  show_attendance: true,
  show_grade_descriptor: true,
  show_grade_descriptor_score_range: true,
  show_identifier_legend: true,
  show_subject_teacher_initials: true,
  show_teacher_comment: true,
  show_header: true,
  show_watermark: false,
  show_school_logo: true,
  show_school_motto: true,
  show_overall_student_rank: true,
  show_stream_student_rank: false,
  show_division_and_aggregate: true,
  show_class_teacher_remarks: true,
  show_head_teacher_remarks: true,
  show_class_teacher_signature: true,
  show_head_teacher_signature: true,
  show_parent_signature: false,
  show_school_dates: true,
  show_school_fees: false,
  school_closed_on: null,
  next_term_begins_on: null,
};

// ─── page ─────────────────────────────────────────────────────────────────────
export default function ReportCardDetailPage({ params }: PageProps) {
  const { id }   = use(params);
  const router   = useRouter();
  const school   = useAppSelector((s) => s.auth.school);
  const dispatch = useAppDispatch();

  const [reportCard,    setReportCard]    = useState<ReportCard | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [cfg,           setCfg]           = useState<ReportCardSettings | null>(null);
  const [gradingSystem, setGradingSystem] = useState<GradingSystem | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [generating,    setGenerating]    = useState(false);

  const [primaryColor, setPrimaryColor] = useState(school?.report_primary_color || '#185FA5');
  const [accentColor,  setAccentColor]  = useState(school?.report_accent_color  || '#4f46e5');

  useEffect(() => {
    if (school?.report_primary_color) setPrimaryColor(school.report_primary_color);
    if (school?.report_accent_color)  setAccentColor(school.report_accent_color);
  }, [school]);

  const handleSaveColors = async () => {
    if (!school?.id) return;
    setSaving(true);
    const res = await UpdateSchool({
      id: school.id,
      data: { report_primary_color: primaryColor, report_accent_color: accentColor } as any,
    });
    if (res.success) { toast.success('Colors saved'); dispatch(setSchool(res.data)); }
    else toast.error('Failed to save colors');
    setSaving(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [rcRes, settingsRes] = await Promise.all([
        FetchReportCardById(id),
        FetchReportCardSettings(),
      ]);

      if (rcRes.success) {
        setReportCard(rcRes.data);
        const gradRes = await FetchGradingSystems({ is_active: true });
        if (gradRes && 'results' in gradRes && gradRes.results.length > 0) {
          setGradingSystem(gradRes.results[0] as any);
        }
      } else {
        toast.error('Failed to load report card');
        router.back();
        return;
      }

      if (settingsRes.success && settingsRes.data) {
        setCfg(settingsRes.data as ReportCardSettings);
      }

      if (school?.id) {
        const schoolRes = await FetchSchoolById(school.id);
        if (schoolRes.success) {
          dispatch(setSchool(schoolRes.data));
        }
      }
      setLoading(false);
    };
    load();
  }, [id, router, school?.id, dispatch]);

  // ── derived ─────────────────────────────────────────────────────────────────
  const s = cfg ?? ({ ...DEFAULT_SETTINGS, id: 0, school: 0, updated_at: '' } as ReportCardSettings);
  const isALevel = reportCard?.class_level === 'Alevel';

  // ── loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="w-full space-y-6 p-8">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );

  if (!reportCard) return null;

  // ── shared card props ─────────────────────────────────────────────────────────
  const cardProps = {
    reportCard,
    s,
    primaryColor,
    accentColor,
    gradingSystem,
    school: school ?? null,
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_REPORTS}>
    <MainLayout
      title={
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Report Card Printout</h1>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isALevel ? 'bg-indigo-400/20 text-indigo-100 border border-indigo-400/30' : 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'}`}>
            {isALevel ? 'A-Level' : 'O-Level'}
          </span>
        </div>
      }
      description="Adjust settings and colors before printing the student's report card."
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl">
            <div className="flex items-center justify-between mb-2 px-2 py-1">
               <span className="text-xs font-bold text-gray-500 uppercase">Primary Color</span>
               <input 
                 type="color" 
                 value={primaryColor} 
                 onChange={(e) => setPrimaryColor(e.target.value)} 
                 className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" 
               />
            </div>
            <div className="flex items-center justify-between mb-2 px-2 py-1">
               <span className="text-xs font-bold text-gray-500 uppercase">Accent Color</span>
               <input 
                 type="color" 
                 value={accentColor} 
                 onChange={(e) => setAccentColor(e.target.value)} 
                 className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent" 
               />
            </div>
            <div className="px-2 pb-2">
              <Button onClick={handleSaveColors} disabled={saving} size="sm" className="w-full text-xs h-8 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20">
                {saving ? 'Saving…' : 'Save Colors'}
              </Button>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Button variant="ghost" onClick={() => setSettingsOpen(true)} className="w-full justify-start h-9 rounded-xl cursor-pointer">
                <Settings2 className="w-4 h-4 mr-2 text-gray-500" /> Printout Settings
              </Button>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Button 
                variant="ghost"
                onClick={async () => {
                  setGenerating(true);
                  const res = await DownloadReportCardPdf(id);
                  if (!res.success) toast.error('Failed to generate PDF');
                  setGenerating(false);
                }} 
                disabled={generating}
                className="w-full justify-start h-9 rounded-xl mt-1 text-primary font-bold cursor-pointer"
              >
                <FileDown className={`w-4 h-4 mr-2 ${generating ? 'animate-bounce' : ''}`} /> 
                {generating ? 'Generating...' : 'Generate PDF'}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="w-full pb-12 mt-[24px]">

      <ReportCardSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={setCfg}
      />

      {/* ── Printable Card: delegate to the correct component ── */}
      {isALevel
        ? <ALevelReportCard {...cardProps} />
        : <OLevelReportCard {...cardProps} />
      }
      </div>
    </MainLayout>
    </ProtectedComponent>
  );
}
