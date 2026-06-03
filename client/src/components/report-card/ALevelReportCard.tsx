'use client';

import React, { useEffect, useState } from 'react';
import { ReportCard, ReportCardSettings, School } from '@/types';
import { FetchGradingSystems, FetchGradingSystemById } from '@/features/reports/reports.service';
import { User } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────
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

/** Maps A-Level letter grades and individual paper subgrades to color classes. */
function aLevelGradeColor(grade?: string) {
  if (!grade) return 'bg-gray-100 text-[var(--My-Black)]';
  const g = grade.toUpperCase();
  if (['A', 'B', 'C', 'D', 'E'].includes(g)) return 'bg-emerald-100 text-emerald-800';
  if (g === 'O') return 'bg-blue-100 text-blue-800';
  if (g === 'F') return 'bg-red-100 text-red-800';

  // Individual paper sub-grades (D1, C5, P7, F9, etc.)
  if (g.startsWith('D')) return 'bg-emerald-50 text-emerald-700';
  if (g.startsWith('C')) return 'bg-blue-50 text-blue-700';
  if (g.startsWith('P')) return 'bg-amber-50 text-amber-700';
  if (g.startsWith('F')) return 'bg-rose-50 text-rose-700';

  return 'bg-gray-100 text-[var(--My-Black)]';
}

/** Generates standard contextual Ugandan A-Level paper comments based on scores. */
function getPaperComment(paper: any) {
  if (paper.remarks) return paper.remarks;
  if (paper.comment) return paper.comment;
  if (paper.description) return paper.description;

  const score = Number(paper.score || 0);
  if (score >= 80) return 'Excellent performance — keep it up!';
  if (score >= 75) return 'Very good performance, maintain the effort.';
  if (score >= 70) return 'Good performance, maintain the effort.';
  if (score >= 65) return 'There is room for improvement.';
  if (score >= 52) return 'Average — revise organic reactions.';
  if (score >= 45) return 'Below average performance, aim higher.';
  if (score >= 40) return 'Weak pass, double your effort.';
  return 'Below average, work extra hard.';
}

// ─── types ────────────────────────────────────────────────────────────────────
interface GradeBoundary { id: number; grade: string; min_score: number; max_score: number; remarks: string; description: string; }
interface GradingSystem { id: number; name: string; boundaries: GradeBoundary[]; }

interface Props {
  reportCard: ReportCard;
  s: ReportCardSettings;
  primaryColor: string;
  accentColor: string;
  gradingSystem: GradingSystem | null;
  school: School | null;
}

// ─── component ────────────────────────────────────────────────────────────────
export function ALevelReportCard({ reportCard, s, primaryColor, accentColor, gradingSystem, school }: Props) {
  const [aLevelGrading, setALevelGrading] = useState<GradingSystem | null>(null);

  useEffect(() => {
    const fetchSys = async () => {
      const listRes = await FetchGradingSystems({ is_active: true });
      if (listRes && 'results' in listRes && listRes.results.length > 0) {
        const sys = listRes.results.find((g: any) => g.level === 'A-Level') || listRes.results.find((g: any) => g.name.toLowerCase().includes('a level')) || listRes.results[0];
        if (sys) {
          const detailRes = await FetchGradingSystemById(sys.id);
          if (detailRes.success) {
            setALevelGrading(detailRes.data as any);
          }
        }
      }
    };
    fetchSys();
  }, []);

  const activeGradingSystem = aLevelGrading || gradingSystem;

  const { subject_reports } = reportCard;
  const daysAbsent = reportCard.attendance_total_days - reportCard.attendance_days_present;

  // Calculate Overall Average
  const overallAvg = subject_reports.length > 0
    ? (subject_reports.reduce((acc, sr) => acc + Number(sr.exam_score || 0), 0) / subject_reports.length).toFixed(1)
    : '0';

  // Compute Passes dynamically for Ugandan A-Level structure
  const principalPasses = subject_reports.filter(
    (sr) => ['A', 'B', 'C', 'D', 'E'].includes(sr.grade || '')
  ).length;

  const subsidiaryPasses = subject_reports.filter(
    (sr) => sr.grade === 'O'
  ).length;

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
          {s.show_school_logo && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-20 h-20 rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center p-1 border border-gray-150">
                {school?.logo ? (
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
          )}
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
      <div className="w-full text-white py-2.5 px-4 rounded-[12px] font-black uppercase text-xs md:text-sm tracking-wider text-center mb-6" style={{ backgroundColor: primaryColor }}>
        Academic Report Form - {reportCard.class_name.toUpperCase()} - {reportCard.term_name.toUpperCase()} - ({reportCard.academic_year_name})
      </div>

      {/* ── Student Profile ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 items-stretch">
        <div className="flex-1 p-5 bg-gradient-to-br from-gray-50/50 to-white flex flex-col md:flex-row gap-6 items-center border border-gray-100 rounded-2xl">
          <div className="w-28 h-32 rounded-[12px] border border-gray-200 overflow-hidden shrink-0 bg-gray-150 flex items-center justify-center">
            {reportCard.student_picture ? (
              <img src={formatImgUrl(reportCard.student_picture) || ''} alt={reportCard.student_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-My-Black">
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
          </div>
        </div>
      </div>

      {/* ── Attendance ── */}
      {s.show_attendance && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total School Days', value: reportCard.attendance_total_days },
            { label: 'Days Present', value: reportCard.attendance_days_present },
            { label: 'Days Absent', value: daysAbsent },
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
        <table className="w-full text-sm border-collapse min-w-[750px]">
          <thead>
            <tr className="text-white uppercase font-bold text-xs" style={{ backgroundColor: primaryColor }}>
              <th className="px-4 py-3 text-left border-r" style={{ borderColor: `${primaryColor}CC` }}>Subject</th>
              <th className="px-3 py-3 text-center border-r w-24" style={{ borderColor: `${primaryColor}CC` }}>Paper</th>
              <th className="px-3 py-3 text-center border-r w-24" style={{ borderColor: `${primaryColor}CC` }}>Marks</th>
              <th className="px-3 py-3 text-center border-r w-24" style={{ borderColor: `${primaryColor}CC` }}>Grade</th>
              <th className="px-4 py-3 text-left border-r" style={{ borderColor: `${primaryColor}CC` }}>Comment</th>
              <th className="px-4 py-3 text-left w-48">{s.show_subject_teacher_initials ? 'Initials' : 'Teacher'}</th>
            </tr>
          </thead>
          <tbody>
            {subject_reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--My-Gray)] italic">
                  No subject results recorded.
                </td>
              </tr>
            ) : (
              subject_reports.map((sr, sIdx) => {
                const papers = sr.competency_scores.filter((c) => c.assessment_type === 'exam');
                const paperCount = papers.length;

                // Fallback for subjects with no explicit individual papers
                if (paperCount === 0) {
                  return (
                    <tr key={sr.id} className={sIdx % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}>
                      <td className="px-4 py-3 font-bold text-[var(--My-Black)] border-r border-b border-gray-200 text-xs align-middle">
                        {sr.subject_name}
                      </td>
                      <td className="px-3 py-3 text-center text-My-Black border-r border-b border-gray-200 font-bold">—</td>
                      <td className="px-3 py-3 text-center text-gray-450 border-r border-b border-gray-200 font-black">—</td>
                      <td className="px-3 py-3 text-center border-r border-b border-gray-200 align-middle">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${aLevelGradeColor(sr.grade)}`}>
                          {sr.grade || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--My-Gray)] border-r border-b border-gray-200 text-[11px] italic align-middle leading-relaxed">
                        {sr.remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--My-Gray)] border-b border-gray-200 text-[11px] font-medium align-middle">
                        {s.show_subject_teacher_initials ? initials(sr.teacher_name) : (sr.teacher_name || '—')}
                      </td>
                    </tr>
                  );
                }

                // Render paper rows vertically with spanned fields
                return (
                  <React.Fragment key={sr.id}>
                    {papers.map((paper, pIdx) => {
                      const isFirst = pIdx === 0;
                      const paperMark = Number(paper.score || 0);
                      const paperComment = getPaperComment(paper);

                      return (
                        <tr key={paper.id} className={sIdx % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}>
                          {isFirst && (
                            <td rowSpan={paperCount} className="px-4 py-3 font-bold text-[var(--My-Black)] border-r border-b border-gray-200 text-xs align-middle">
                              {sr.subject_name}
                            </td>
                          )}

                          <td className="px-3 py-3 text-center text-My-Black border-r border-b border-gray-200 font-bold text-xs align-middle">
                            {paper.competency_name ? paper.competency_name.split(' (')[0] : `Paper ${pIdx + 1}`}
                          </td>

                          <td className="px-3 py-3 text-center border-r border-b border-gray-200 font-black text-sm text-[var(--My-Black)] align-middle">
                            {paperMark.toFixed(0)}%
                          </td>

                          {isFirst && (
                            <td rowSpan={paperCount} className="px-3 py-3 text-center border-r border-b border-gray-200 align-middle">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${aLevelGradeColor(sr.grade)}`}>
                                {sr.grade || '—'}
                              </span>
                            </td>
                          )}

                          <td className="px-4 py-3 text-[var(--My-Gray)] border-r border-b border-gray-200 text-[11px] italic align-middle leading-relaxed">
                            {paperComment}
                          </td>

                          {isFirst && (
                            <td rowSpan={paperCount} className="px-4 py-3 text-[var(--My-Gray)] border-b border-gray-200 text-[11px] font-medium align-middle">
                              {s.show_subject_teacher_initials ? initials(sr.teacher_name) : (sr.teacher_name || '—')}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Remarks & Official Comments ── */}
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
                  &ldquo;{reportCard.class_teacher_remarks || "You're making a good start! Keep practicing and believe in yourself."}&rdquo;
                </p>
                {s.show_class_teacher_signature && (
                  <div className="flex justify-end text-[9px] text-[var(--My-Gray)] font-bold italic mt-2">
                    Class Teacher Signature: <span className="ml-1 border-b border-gray-300 w-32 inline-block"></span>
                  </div>
                )}
              </div>
            )}

            {/* House Teacher Remarks */}
            <div>
              <p className="text-[10px] font-bold text-[var(--My-Gray)] uppercase tracking-wider mb-1">House Teacher</p>
              <div className="text-xs text-My-Black tracking-widest font-mono select-none">....................................................................................</div>
            </div>

            {s.show_head_teacher_remarks && (
              <div>
                <p className="text-[10px] font-bold text-[var(--My-Gray)] uppercase tracking-wider mb-1">Head Teacher&apos;s Remarks</p>
                <p className="text-sm font-medium text-[var(--My-Black)] italic border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                  &ldquo;{reportCard.head_teacher_remarks || "While you've met basic standards, more practice and focus on skills will benefit you. Stay focused and keep working hard!"}&rdquo;
                </p>
                {s.show_head_teacher_signature && (
                  <div className="flex justify-end text-[9px] text-[var(--My-Gray)] font-bold italic mt-2">
                    Head Teacher Signature & Stamp: <span className="ml-1 border-b border-gray-300 w-32 inline-block"></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Passes, Average, QR Code ── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50/40">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">Principal Passes</p>
          <p className="text-2xl font-black text-[var(--My-Black)]">{principalPasses}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50/40">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">Subsidiary Passes</p>
          <p className="text-2xl font-black text-[var(--My-Black)]">{subsidiaryPasses}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50/40">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">Overall Average %</p>
          <p className="text-2xl font-black text-[var(--My-Black)]" style={{ color: accentColor }}>{overallAvg}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center bg-gray-50/40 flex flex-col justify-center items-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-1">Interactive Profile</p>
          <div className="bg-white border border-gray-200 px-3 py-1 rounded text-[10px] font-extrabold text-[var(--My-Black)] uppercase tracking-wider">
            {reportCard.student_id_code}@{school?.name?.replace(/\s+/g, '').toLowerCase() || 'mayangapsss'}
          </div>
        </div>
      </div>

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
                      <span className={`inline-block px-2 py-0.5 rounded font-black ${aLevelGradeColor(b.grade)}`}>{b.grade}</span>
                    </td>
                    {s.show_grade_descriptor_score_range && (
                      <td className="px-3 py-2 text-center border-r border-gray-200 font-bold text-My-Black">
                        {Math.round(b.min_score)} – {Math.round(b.max_score)}
                      </td>
                    )}
                    <td className="px-3 py-2 text-My-Black leading-relaxed italic">{b.description || b.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── School Dates / Motto Footer ── */}
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

      {s.show_school_motto && school?.motto && (
        <div className="mt-8 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden flex flex-col sm:flex-row items-center justify-between p-3 gap-3">
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-250 shrink-0">
            <div className="w-4 h-6 bg-emerald-600" />
            <div className="bg-blue-600 text-white py-1 px-4 text-[9px] font-black italic tracking-widest uppercase">
              {school.motto}
            </div>
          </div>
          <div className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest pr-3 text-center sm:text-right">
            {school.name}  ·  {reportCard.academic_year_name}
          </div>
        </div>
      )}
    </div>
  );
}
