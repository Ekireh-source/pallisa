'use client';

import React, { useEffect, useState } from 'react';
import { ReportCard, ReportCardSettings, School } from '@/types';
import { FetchGradingSystems, FetchGradingSystemById } from '@/features/reports/reports.service';
import { User } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatImgUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initials(name?: string) {
  if (!name) return '—';
  return name.split(' ').map((n) => n[0]).join('.') + '.';
}

function gradeColor(grade?: string) {
  if (!grade) return 'bg-gray-100 text-[var(--My-Black)]';
  if (['D1', 'D2'].includes(grade)) return 'bg-emerald-100 text-emerald-800';
  if (['C3', 'C4', 'C5', 'C6'].includes(grade)) return 'bg-blue-100 text-blue-800';
  if (['P7', 'P8'].includes(grade)) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

// ─── types ───────────────────────────────────────────────────────────────────
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
// School is imported from @/types

interface Props {
  reportCard: ReportCard;
  s: ReportCardSettings;
  primaryColor: string;
  accentColor: string;
  gradingSystem: GradingSystem | null;
  school: School | null;
}

// ─── component ───────────────────────────────────────────────────────────────
export function OLevelReportCard({ reportCard, s, primaryColor, accentColor, gradingSystem, school }: Props) {
  const [oLevelGrading, setOLevelGrading] = useState<GradingSystem | null>(null);

  useEffect(() => {
    const fetchSys = async () => {
      const listRes = await FetchGradingSystems({ is_active: true });
      if (listRes && 'results' in listRes && listRes.results.length > 0) {
        const sys = listRes.results.find((g: any) => g.level === 'O-Level') || listRes.results.find((g: any) => g.name.toLowerCase().includes('o level')) || listRes.results[0];
        if (sys) {
          const detailRes = await FetchGradingSystemById(sys.id);
          if (detailRes.success) {
            setOLevelGrading(detailRes.data as any);
          }
        }
      }
    };
    fetchSys();
  }, []);

  const activeGradingSystem = oLevelGrading || gradingSystem;

  const { subject_reports } = reportCard;

  const aoisOnly = subject_reports.map((sr) => sr.competency_scores.filter((c) => c.assessment_type === 'aoi'));
  const maxAois  = Math.max(...aoisOnly.map((a) => a.length), 0);

  const totalAoi  = subject_reports.reduce((acc, sr) => acc + Number(sr.aoi_score  || 0), 0);
  const totalExam = subject_reports.reduce((acc, sr) => acc + Number(sr.exam_score || 0), 0);
  const totalCum  = totalAoi + totalExam;
  const maxTotal  = subject_reports.length * 100;
  const avg       = subject_reports.length > 0 ? (totalCum / subject_reports.length).toFixed(1) : '0';
  const daysAbsent = reportCard.attendance_total_days - reportCard.attendance_days_present;

  const sigCount = [s.show_class_teacher_signature, s.show_head_teacher_signature, s.show_parent_signature].filter(Boolean).length;

  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl p-8 md:p-12 print:border-none print:p-0 overflow-hidden pl-12">

      {/* Watermark */}
      {s.show_watermark && school?.logo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.03]">
          <img src={formatImgUrl(school.logo) || ''} alt="" className="w-96 h-96 object-contain" />
        </div>
      )}

      {/* ── School Header ── */}
      {s.show_header && (
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between border-b-2 pb-6 mb-6" style={{ borderColor: `${primaryColor}15` }}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-20 h-20 rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center p-1 border border-gray-150">
              {s.show_school_logo && school?.logo ? (
                <img src={formatImgUrl(school.logo) || ''} alt="School Logo" className="w-full h-full object-contain" />
              ) : (
                <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width={50} height={50}>
                  <circle cx="15" cy="8" r="4" fill={primaryColor} />
                  <path d="M15 13 L6 18 L15 23 L24 18 Z" fill={primaryColor} />
                  <rect x="12" y="23" width="6" height="4" rx="1" fill={primaryColor} />
                </svg>
              )}
            </div>
          </div>
          <div className="text-center md:text-right mt-4 md:mt-0 flex-1 md:pl-8">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[var(--My-Black)]">
              {school?.name || 'MAYANGA PROGRESSIVE SEED SECONDARY SCHOOL'}
            </h1>
            <p className="text-xs font-semibold text-[var(--My-Gray)] mt-1">
              {[school?.address || 'P. O. BOX 98, MITOOMA', school?.phone_number || school?.phone || '0784514186', school?.email || 'mayangaprogseedss@gmail.com'].filter(Boolean).join(' · ')}
            </p>
            {s.show_school_motto && school?.motto && (
              <p className="text-xs font-bold italic text-[var(--My-Gray)] mt-1">Motto: &ldquo;{school.motto}&rdquo;</p>
            )}
          </div>
        </div>
      )}

      {/* ── Academic Report Blue Banner ── */}
      <div className="w-full bg-primary text-white py-2.5 px-4 rounded-[12px] font-black uppercase text-xs md:text-sm tracking-wider text-center mb-6">
        Academic Report Form - {reportCard.class_name.toUpperCase()} - {reportCard.term_name.toUpperCase()} - ({reportCard.academic_year_name})
      </div>

      {/* ── Student Profile & Performance Graph ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 items-stretch">
        
        {/* Left Box: Student Avatar & Passport Details */}
        <div className="flex-1 p-5 bg-gradient-to-br from-gray-50/50 to-white flex flex-col md:flex-row gap-6 items-center">
          <div className="w-28 h-32 rounded-[12px] border border-gray-200 overflow-hidden shrink-0 bg-gray-150 flex items-center justify-center ">
            {reportCard.student_picture ? (
              <img src={formatImgUrl(reportCard.student_picture) || ''} alt={reportCard.student_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <User size={48} className="stroke-[1.5]" />
              </div>
            )}
          </div>
          <div className="flex-1 w-full space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--My-Gray)] block mb-0.5">Student Name</span>
                <span className="font-black text-[var(--My-Black)] text-base">{reportCard.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--My-Gray)] block mb-0.5">Admission No.</span>
                <span className="font-bold text-[var(--My-Black)]">{reportCard.student_id_code}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--My-Gray)] block mb-0.5">Senior / Stream</span>
                <span className="font-bold text-[var(--My-Black)]">{reportCard.class_name} {reportCard.stream_name ? ` · ${reportCard.stream_name}` : ''}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--My-Gray)] block mb-0.5">Class Teacher</span>
                <span className="font-bold text-[var(--My-Black)]">{reportCard.class_teacher_name || '—'}</span>
              </div>
            </div>

            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] block mb-0.5">Total Marks</span>
                <span className="text-sm font-black" style={{ color: primaryColor }}>{Number(totalCum).toFixed(1)} <span className="text-[9px] opacity-40">/ {maxTotal}</span></span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest block mb-0.5" style={{ color: accentColor }}>Average</span>
                <span className="text-sm font-black" style={{ color: accentColor }}>{avg}%</span>
              </div>
              {s.show_overall_student_rank && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] block mb-0.5">Position</span>
                  <span className="text-sm font-black text-[var(--My-Black)]">{reportCard.position || '—'} <span className="text-[9px] opacity-40">/ {reportCard.out_of || '—'}</span></span>
                </div>
              )}
              {s.show_division_and_aggregate && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] block mb-0.5">Division</span>
                  <span className="text-sm font-black text-[var(--My-Black)]">{reportCard.overall_grade || '—'}</span>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>

      {/* ── Attendance ── */}
      {s.show_attendance && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total School Days', value: reportCard.attendance_total_days },
            { label: 'Days Present',      value: reportCard.attendance_days_present },
            { label: 'Days Absent',       value: daysAbsent },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-200 p-3 text-center bg-gray-50/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">{label}</p>
              <p className="text-xl font-black text-[var(--My-Black)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Marks Table ── */}
      <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[800px]">
          <thead>
            <tr className="text-white" style={{ backgroundColor: primaryColor }}>
              <th className="px-4 py-3 text-left font-bold border-r" style={{ borderColor: `${primaryColor}CC` }}>Subject</th>
              {Array.from({ length: Math.max(1, maxAois) }).map((_, i) => (
                <th key={i} className="px-2 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>AOI {i + 1}</th>
              ))}
              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>FWRMTV SCORE<br /><span className="opacity-70">(20%)</span></th>
              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>EXAM SCORE<br /><span className="opacity-70">(80%)</span></th>
              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>TOTAL SCORE<br /><span className="opacity-70">(100%)</span></th>
              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>Grd</th>
              {s.show_teacher_comment && <th className="px-3 py-3 text-left font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>Remarks</th>}
              <th className="px-3 py-3 text-left font-bold text-xs">{s.show_subject_teacher_initials ? 'Initials' : 'Teacher'}</th>
            </tr>
          </thead>
          <tbody>
            {subject_reports.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-[var(--My-Gray)] italic">No subject results recorded.</td></tr>
            ) : subject_reports.map((sr, i) => {
              const aois     = sr.competency_scores.filter(c => c.assessment_type === 'aoi');
              const subTotal = Number(sr.aoi_score || 0) + Number(sr.exam_score || 0);
              return (
                <tr key={sr.id} className={i % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}>
                  <td className="px-4 py-2.5 font-bold text-[var(--My-Black)] border-r border-b border-gray-200 text-xs">{sr.subject_name}</td>
                  {Array.from({ length: Math.max(1, maxAois) }).map((_, idx) => (
                    <td key={idx} className="px-2 py-2.5 text-center text-gray-700 border-r border-b border-gray-200 text-xs">{aois[idx]?.score ?? '—'}</td>
                  ))}
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 border-r border-b border-gray-200 text-xs">{sr.aoi_score}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-700 border-r border-b border-gray-200 text-xs">{sr.exam_score}</td>
                  <td className="px-3 py-2.5 text-center font-black text-[var(--My-Black)] border-r border-b border-gray-200 text-xs">{subTotal}</td>
                  <td className="px-2 py-2.5 text-center border-r border-b border-gray-200">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${gradeColor(sr.grade)}`}>{sr.grade || '—'}</span>
                  </td>
                  {s.show_teacher_comment && <td className="px-3 py-2.5 text-[var(--My-Gray)] border-r border-b border-gray-200 text-[11px]">{sr.remarks || '—'}</td>}
                  <td className="px-3 py-2.5 text-[var(--My-Gray)] border-b border-gray-200 text-[11px]">
                    {s.show_subject_teacher_initials ? initials(sr.teacher_name) : (sr.teacher_name || '—')}
                  </td>
                </tr>
              );
            })}
            {subject_reports.length > 0 && (
              <tr className="bg-gray-100">
                <td colSpan={1 + Math.max(1, maxAois)} className="px-4 py-2.5 text-right font-black text-gray-700 border-r border-gray-200 uppercase tracking-widest text-[10px]">Totals</td>
                <td className="px-3 py-2.5 text-center font-bold text-[var(--My-Black)] border-r border-gray-200 text-xs">{totalAoi.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center font-bold text-[var(--My-Black)] border-r border-gray-200 text-xs">{totalExam.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center font-black border-r border-gray-200 text-sm" style={{ color: accentColor }}>{totalCum.toFixed(1)}</td>
                <td colSpan={s.show_teacher_comment ? 3 : 2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Identifier Legend ── */}
      {s.show_identifier_legend && maxAois > 0 && (
        <div className="mb-6 border border-gray-100 rounded-xl p-4 bg-gray-50/40">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-2">Identifier Key</p>
          <div className="flex gap-6 flex-wrap">
            {Array.from({ length: maxAois }).map((_, i) => (
              <span key={i} className="text-xs text-gray-600 font-medium">
                <span className="font-bold text-[var(--My-Black)]">AOI {i + 1}</span> – Activity of Integration {i + 1} <span className="text-[var(--My-Gray)]">(max: 3.0)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Remarks ── */}
      {(s.show_class_teacher_remarks || s.show_head_teacher_remarks) && (
        <div className="mb-8 border-2 border-gray-100 rounded-2xl p-5 relative">
          <div className="absolute -top-3 left-4 bg-white px-2">
            <p className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest">Official Remarks</p>
          </div>
          <div className="space-y-4">
            {s.show_class_teacher_remarks && (
              <div>
                <p className="text-[10px] font-bold text-[var(--My-Gray)] uppercase tracking-wider mb-1">Class Teacher&apos;s Remarks</p>
                <p className="text-sm font-medium text-[var(--My-Black)] italic border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                  &ldquo;{reportCard.class_teacher_remarks || 'A promising performance.'}&rdquo;
                </p>
              </div>
            )}
            {s.show_head_teacher_remarks && (
              <div>
                <p className="text-[10px] font-bold text-[var(--My-Gray)] uppercase tracking-wider mb-1">Head Teacher&apos;s Remarks</p>
                <p className="text-sm font-medium text-[var(--My-Black)] italic border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                  &ldquo;{reportCard.head_teacher_remarks || 'Promoted to the next class.'}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Signatures ── */}
      {sigCount > 0 && (
        <div className="grid gap-8 pt-6 border-t-2 border-gray-100" style={{ gridTemplateColumns: `repeat(${sigCount}, 1fr)` }}>
          {s.show_class_teacher_signature && (
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-2" />
              <p className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest">Class Teacher</p>
            </div>
          )}
          {s.show_head_teacher_signature && (
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-2" />
              <p className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest">Head Teacher</p>
            </div>
          )}
          {s.show_parent_signature && (
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-2" />
              <p className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest">Parent / Guardian</p>
            </div>
          )}
        </div>
      )}

      {/* ── Grade Key ── */}
      {s.show_grade_descriptor && activeGradingSystem && activeGradingSystem.boundaries.length > 0 && (
        <div className="mt-8 mb-8">
          <div className="mb-3 border-b-2 pb-1" style={{ borderColor: `${primaryColor}20` }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--My-Gray)]">Grading Key &amp; Performance Descriptors</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[var(--My-Gray)] font-bold uppercase tracking-tighter">
                  <th className="px-3 py-2 text-left border-r border-gray-200 w-24">Grade</th>
                  {s.show_grade_descriptor_score_range && <th className="px-3 py-2 text-center border-r border-gray-200 w-24">Marks Range</th>}
                  <th className="px-3 py-2 text-left">Descriptor</th>
                </tr>
              </thead>
              <tbody>
                {activeGradingSystem.boundaries.slice().sort((a, b) => b.min_score - a.min_score).map((b, i) => (
                  <tr key={b.id} className={i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <span className={`inline-block px-2 py-0.5 rounded font-black ${gradeColor(b.grade)}`}>{b.grade}</span>
                    </td>
                    {s.show_grade_descriptor_score_range && (
                      <td className="px-3 py-2 text-center border-r border-gray-200 font-bold text-gray-600">
                        {Math.round(b.min_score)} – {Math.round(b.max_score)}
                      </td>
                    )}
                    <td className="px-3 py-2 text-gray-600 leading-relaxed italic">{b.description || b.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── School Dates ── */}
      {s.show_school_dates && (s.school_closed_on || s.next_term_begins_on) && (
        <div className="mt-8 pt-6 border-t-2 border-gray-100 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">School Closed On</p>
            <p className="text-sm font-bold text-[var(--My-Black)]">{fmtDate(s.school_closed_on)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">Next Term Begins On</p>
            <p className="text-sm font-bold text-[var(--My-Black)]">{fmtDate(s.next_term_begins_on)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
