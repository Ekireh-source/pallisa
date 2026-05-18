'use client';

import React, { useEffect, useState, use } from 'react';
import { Printer, ArrowLeft, Settings2 } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { FetchReportCardById, FetchReportCardSettings, FetchGradingSystems } from '@/features/reports/reports.service';
import { ReportCard, ReportCardSettings } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store';
import { UpdateSchool } from '@/features/school/school.service';
import { setSchool } from '@/store/auth/actions';
import { ReportCardSettingsPanel } from '@/components/report-card/ReportCardSettingsPanel';
import { OLevelReportCard } from '@/components/report-card/OLevelReportCard';
import { ALevelReportCard } from '@/components/report-card/ALevelReportCard';

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
        if (gradRes.success && gradRes.data.results?.length > 0) {
          setGradingSystem(gradRes.data.results[0]);
        }
      } else {
        toast.error('Failed to load report card');
        router.back();
      }

      if (settingsRes.success && settingsRes.data) {
        setCfg(settingsRes.data as ReportCardSettings);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  // ── derived ─────────────────────────────────────────────────────────────────
  const s = cfg ?? ({ ...DEFAULT_SETTINGS, id: 0, school: 0, updated_at: '' } as ReportCardSettings);
  const isALevel = reportCard?.class_level === 'Alevel';

  // ── loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6 p-8">
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
    <div className="max-w-5xl mx-auto pb-12">

      {/* ── Action Bar (screen only) ── */}
      <div className="print:hidden flex items-center justify-between mb-6 flex-wrap gap-4">
        <Button variant="ghost" className="gap-2 rounded-2xl" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex items-center gap-3 flex-wrap">
          {/* colour pickers */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400">Header</span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-none p-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400">Accent</span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-none p-0 bg-transparent"
            />
          </div>

          <Button
            variant="outline" size="sm"
            onClick={handleSaveColors} disabled={saving}
            className="rounded-2xl h-8 text-[10px] font-black uppercase tracking-widest border-dashed"
          >
            {saving ? 'Saving…' : 'Save Colors'}
          </Button>

          <Button
            variant="outline" size="sm"
            onClick={() => setSettingsOpen(true)}
            className="rounded-2xl h-8 gap-1.5"
          >
            <Settings2 className="w-3.5 h-3.5" /> Printout Settings
          </Button>

          {/* Level badge */}
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isALevel ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isALevel ? 'A-Level' : 'O-Level'}
          </span>

          <Button onClick={() => window.print()} className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

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
  );
}
