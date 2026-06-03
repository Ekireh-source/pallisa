'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Settings, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { ReportCardSettings } from '@/types';
import {
  FetchReportCardSettings,
  UpdateReportCardSettings,
  CreateOrEnsureReportCardSettings,
} from '@/features/reports/reports.service';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToggleKey = keyof Omit<ReportCardSettings, 'id' | 'school' | 'school_closed_on' | 'next_term_begins_on' | 'updated_at'>;

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckboxRow({ label, checked, onChange, disabled }: CheckboxRowProps) {
  return (
    <label className={`flex items-center gap-3 py-2 cursor-pointer group ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-150
          ${checked
            ? 'bg-emerald-500 border-emerald-500 '
            : 'border-gray-300 bg-white group-hover:border-emerald-400'
          }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm text-My-Black select-none leading-tight">{label}</span>
    </label>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p className="text-xs font-black uppercase tracking-widest text-My-Black pt-4 pb-1 border-t border-gray-100 first:border-t-0 first:pt-0">
      {label}
    </p>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: ReportCardSettings) => void;
}

export function ReportCardSettingsPanel({ open, onClose, onSettingsChange }: Props) {
  const [settings, setSettings] = useState<ReportCardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Load settings when opening
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      let res = await FetchReportCardSettings();
      if (!res.success || !res.data) {
        // First time — create defaults
        res = await CreateOrEnsureReportCardSettings();
      }
      if (res.success && res.data) {
        setSettings(res.data as ReportCardSettings);
        onSettingsChange?.(res.data as ReportCardSettings);
      }
      setLoading(false);
    };
    load();
  }, [open]); // eslint-disable-line

  const toggle = async (key: ToggleKey) => {
    if (!settings) return;
    const newVal = !settings[key];
    const updated = { ...settings, [key]: newVal };
    setSettings(updated);
    onSettingsChange?.(updated);

    setSaving(true);
    const res = await UpdateReportCardSettings(settings.id, { [key]: newVal });
    if (!res.success) {
      // Revert on failure
      setSettings(settings);
      onSettingsChange?.(settings);
      toast.error('Failed to save setting');
    }
    setSaving(false);
  };

  const setDate = async (key: 'school_closed_on' | 'next_term_begins_on', value: string) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value || null };
    setSettings(updated);
    onSettingsChange?.(updated);

    const res = await UpdateReportCardSettings(settings.id, { [key]: value || null });
    if (!res.success) {
      toast.error('Failed to save date');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-80 h-full bg-white -2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Settings className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-black text-My-Black">Printout Settings</p>
              {saving && (
                <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Saving…
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : !settings ? (
            <p className="text-sm text-My-Black text-center py-8">Could not load settings.</p>
          ) : (
            <div className="space-y-0.5">

              {/* ── School Dates ───────────────────────────────────────── */}
              <SectionHeading label="School Closed On" />
              <div className="pb-1">
                <input
                  type="date"
                  value={settings.school_closed_on || ''}
                  onChange={(e) => setDate('school_closed_on', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <SectionHeading label="Next Term Begins On" />
              <div className="pb-1">
                <input
                  type="date"
                  value={settings.next_term_begins_on || ''}
                  onChange={(e) => setDate('next_term_begins_on', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* ── Report ─────────────────────────────────────────────── */}
              <SectionHeading label="Report" />
              <CheckboxRow label="Show attendance report" checked={settings.show_attendance} onChange={() => toggle('show_attendance')} />
              <CheckboxRow label="Show grade descriptor" checked={settings.show_grade_descriptor} onChange={() => toggle('show_grade_descriptor')} />
              <CheckboxRow
                label="Show grade descriptor's score range"
                checked={settings.show_grade_descriptor_score_range}
                onChange={() => toggle('show_grade_descriptor_score_range')}
                disabled={!settings.show_grade_descriptor}
              />
              <CheckboxRow label="Show identifier legend" checked={settings.show_identifier_legend} onChange={() => toggle('show_identifier_legend')} />
              <CheckboxRow label="Show subject teacher initials" checked={settings.show_subject_teacher_initials} onChange={() => toggle('show_subject_teacher_initials')} />
              <CheckboxRow label="Show teacher comment" checked={settings.show_teacher_comment} onChange={() => toggle('show_teacher_comment')} />
              <CheckboxRow label="Show header" checked={settings.show_header} onChange={() => toggle('show_header')} />

              {/* ── Rank ───────────────────────────────────────────────── */}
              <SectionHeading label="Rank" />
              <CheckboxRow label="Show overall student rank" checked={settings.show_overall_student_rank} onChange={() => toggle('show_overall_student_rank')} />
              <CheckboxRow label="Show stream student rank" checked={settings.show_stream_student_rank} onChange={() => toggle('show_stream_student_rank')} />
              <CheckboxRow label="Show division and aggregate" checked={settings.show_division_and_aggregate} onChange={() => toggle('show_division_and_aggregate')} />

              {/* ── Remarks ────────────────────────────────────────────── */}
              <SectionHeading label="Remarks" />
              <CheckboxRow label="Class Teacher" checked={settings.show_class_teacher_remarks} onChange={() => toggle('show_class_teacher_remarks')} />
              <CheckboxRow label="Head Teacher" checked={settings.show_head_teacher_remarks} onChange={() => toggle('show_head_teacher_remarks')} />

              {/* ── Signatures ─────────────────────────────────────────── */}
              <SectionHeading label="Signatures" />
              <CheckboxRow label="Class Teacher" checked={settings.show_class_teacher_signature} onChange={() => toggle('show_class_teacher_signature')} />
              <CheckboxRow label="Head Teacher" checked={settings.show_head_teacher_signature} onChange={() => toggle('show_head_teacher_signature')} />
              <CheckboxRow label="Parent / Guardian" checked={settings.show_parent_signature} onChange={() => toggle('show_parent_signature')} />

              {/* ── Layout ─────────────────────────────────────────────── */}
              <SectionHeading label="Layout" />
              <CheckboxRow label="Show header" checked={settings.show_header} onChange={() => toggle('show_header')} />
              <CheckboxRow label="Show school logo" checked={settings.show_school_logo} onChange={() => toggle('show_school_logo')} />
              <CheckboxRow label="Show school motto" checked={settings.show_school_motto} onChange={() => toggle('show_school_motto')} />
              <CheckboxRow label="Show watermark" checked={settings.show_watermark} onChange={() => toggle('show_watermark')} />
              <CheckboxRow label="Show school dates" checked={settings.show_school_dates} onChange={() => toggle('show_school_dates')} />
              <CheckboxRow label="Show school fees" checked={settings.show_school_fees} onChange={() => toggle('show_school_fees')} />

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
