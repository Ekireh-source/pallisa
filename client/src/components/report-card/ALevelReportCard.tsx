'use client';

import React from 'react';
import { ReportCard, ReportCardSettings, School } from '@/types';

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

/** Maps A-Level letter grade → colour classes. */
function aLevelGradeColor(grade?: string) {
  if (!grade) return 'bg-gray-100 text-gray-700';
  if (grade === 'A') return 'bg-emerald-100 text-emerald-800';
  if (grade === 'B') return 'bg-teal-100 text-teal-800';
  if (grade === 'C') return 'bg-sky-100 text-sky-800';
  if (grade === 'D') return 'bg-blue-100 text-blue-800';
  if (grade === 'E') return 'bg-amber-100 text-amber-800';
  if (grade === 'O') return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800'; // F
}

// ─── types ────────────────────────────────────────────────────────────────────
interface GradeBoundary { id: number; grade: string; min_score: number; max_score: number; remarks: string; description: string; }
interface GradingSystem { id: number; name: string; boundaries: GradeBoundary[]; }
// School is imported from @/types

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
  const { subject_reports } = reportCard;

  // For each subject, paper scores are stored as competency_scores with type 'exam'
  // the exam_score field holds the averaged % across papers
  const daysAbsent = reportCard.attendance_total_days - reportCard.attendance_days_present;

  // Determine the maximum number of papers across all subjects so we can span the right number of columns
  const papersPerSubject = subject_reports.map((sr) =>
    sr.competency_scores.filter((c) => c.assessment_type === 'exam')
  );
  const maxPapers = Math.max(...papersPerSubject.map((p) => p.length), 1);

  const overallAvg = subject_reports.length > 0
    ? (subject_reports.reduce((acc, sr) => acc + Number(sr.exam_score || 0), 0) / subject_reports.length).toFixed(1)
    : '0';

  const sigCount = [s.show_class_teacher_signature, s.show_head_teacher_signature, s.show_parent_signature].filter(Boolean).length;

  const bdr = (extra = '') => `border-r border-b border-gray-200 ${extra}`;
  const th   = (extra = '') => `px-3 py-3 text-center font-bold text-xs border-r last:border-r-0`;

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl shadow-md p-8 md:p-12 print:border-none print:shadow-none print:p-0 overflow-hidden">

      {/* Watermark */}
      {s.show_watermark && school?.logo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
          <img src={formatImgUrl(school.logo) || ''} alt="" className="w-96 h-96 object-contain" />
        </div>
      )}

      {/* ── Header ── */}
      {s.show_header && (
        <div className="flex items-center justify-between border-b-[3px] pb-6 mb-8" style={{ borderColor: primaryColor }}>
          <div className="flex-shrink-0 w-16 h-16">
            {s.show_school_logo && school?.logo
              ? <img src={formatImgUrl(school.logo) || ''} alt="logo" className="w-full h-full object-contain" />
              : (
                <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width={60} height={60}>
                  <circle cx="15" cy="8" r="4" fill={primaryColor} />
                  <path d="M15 13 L6 18 L15 23 L24 18 Z" fill={primaryColor} />
                  <rect x="12" y="23" width="6" height="4" rx="1" fill={primaryColor} />
                </svg>
              )}
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider" style={{ color: primaryColor }}>
              {school?.name || 'School Name'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {[school?.phone_number || school?.phone, school?.email].filter(Boolean).join(' · ')}
              {school?.address ? ` · ${school.address}` : ''}
            </p>
            {s.show_school_motto && school?.motto && (
              <p className="text-xs font-semibold italic text-gray-400 mt-1">&ldquo;{school.motto}&rdquo;</p>
            )}
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">A-Level Academic Report Card</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="inline-block border-2 rounded-lg px-4 py-2 font-black text-sm uppercase text-center" style={{ borderColor: primaryColor, color: primaryColor }}>
              {reportCard.term_name}<br />{reportCard.academic_year_name}
            </div>
          </div>
        </div>
      )}

      {/* ── Student Info & Stats ── */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <div className="w-28 h-28 rounded-2xl border-2 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center" style={{ borderColor: `${primaryColor}20` }}>
          {reportCard.student_picture
            ? <img src={formatImgUrl(reportCard.student_picture) || ''} alt={reportCard.student_name} className="w-full h-full object-cover" />
            : <p className="text-3xl font-black text-gray-200 uppercase">{reportCard.student_name.split(' ').map(n => n[0]).join('')}</p>}
        </div>
        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Student Name',   value: reportCard.student_name },
              { label: 'Admission No.',  value: reportCard.student_id_code },
              { label: 'Class / Stream', value: `${reportCard.class_name} · ${reportCard.stream_name}` },
              { label: 'Class Teacher',  value: reportCard.class_teacher_name || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border p-3 bg-gray-50/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-black text-gray-900 truncate">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Overall average % */}
            <div className="rounded-xl border-2 p-3 bg-white" style={{ borderColor: `${primaryColor}15` }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Overall Average</p>
              <p className="text-lg font-black" style={{ color: primaryColor }}>{overallAvg}%</p>
            </div>
            <div className="rounded-xl border-2 p-3" style={{ backgroundColor: `${accentColor}05`, borderColor: `${accentColor}25` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>Subjects Sat</p>
              <p className="text-lg font-black" style={{ color: accentColor }}>{subject_reports.length}</p>
            </div>
            {s.show_overall_student_rank && (
              <div className="rounded-xl border-2 p-3 bg-white" style={{ borderColor: `${primaryColor}15` }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Position</p>
                <p className="text-lg font-black text-gray-900">{reportCard.position || '—'} <span className="text-[10px] opacity-40">/ {reportCard.out_of || '—'}</span></p>
              </div>
            )}
            {s.show_division_and_aggregate && (
              <div className="rounded-xl border-2 p-3 bg-white" style={{ borderColor: `${primaryColor}15` }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Overall Grade</p>
                <p className="text-lg font-black text-gray-900">{reportCard.overall_grade || '—'}</p>
              </div>
            )}
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
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              <p className="text-xl font-black text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── A-Level Marks Table ── */}
      {/*
        Layout per subject row:
          Subject | Paper 1 score | Paper 2 score | … | Average % | Grade | Remarks | Teacher
      */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-white" style={{ backgroundColor: primaryColor }}>
              <th className="px-4 py-3 text-left font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>Subject</th>

              {/* Dynamic paper columns header */}
              {Array.from({ length: maxPapers }).map((_, i) => (
                <th key={i} className="px-2 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>
                  Paper {i + 1}
                </th>
              ))}

              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>
                Average<br /><span className="opacity-70">%</span>
              </th>
              <th className="px-3 py-3 text-center font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>Grade</th>
              {s.show_teacher_comment && (
                <th className="px-3 py-3 text-left font-bold border-r text-xs" style={{ borderColor: `${primaryColor}CC` }}>Remarks</th>
              )}
              <th className="px-3 py-3 text-left font-bold text-xs">
                {s.show_subject_teacher_initials ? 'Initials' : 'Teacher'}
              </th>
            </tr>
          </thead>
          <tbody>
            {subject_reports.length === 0 ? (
              <tr>
                <td colSpan={3 + maxPapers + (s.show_teacher_comment ? 1 : 0)} className="px-4 py-8 text-center text-gray-400 italic">
                  No subject results recorded.
                </td>
              </tr>
            ) : (
              subject_reports.map((sr, i) => {
                const papers = sr.competency_scores.filter((c) => c.assessment_type === 'exam');
                const avg    = Number(sr.exam_score || 0);

                return (
                  <tr key={sr.id} className={i % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}>
                    {/* Subject name */}
                    <td className="px-4 py-2.5 font-bold text-gray-900 border-r border-b border-gray-200 text-xs">
                      {sr.subject_name}
                      {sr.subject_code && (
                        <span className="ml-1 text-gray-400 font-normal">({sr.subject_code})</span>
                      )}
                    </td>

                    {/* Per-paper score cells */}
                    {Array.from({ length: maxPapers }).map((_, idx) => {
                      const paper = papers[idx];
                      return (
                        <td key={idx} className="px-2 py-2.5 text-center border-r border-b border-gray-200 text-xs">
                          {paper ? (
                            <span className="font-semibold text-gray-800">{Number(paper.score).toFixed(0)}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Average % */}
                    <td className="px-3 py-2.5 text-center font-black border-r border-b border-gray-200 text-xs" style={{ color: primaryColor }}>
                      {avg.toFixed(1)}%
                    </td>

                    {/* Grade badge */}
                    <td className="px-2 py-2.5 text-center border-r border-b border-gray-200">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold tracking-wide ${aLevelGradeColor(sr.grade)}`}>
                        {sr.grade || '—'}
                      </span>
                    </td>

                    {/* Remarks */}
                    {s.show_teacher_comment && (
                      <td className="px-3 py-2.5 text-gray-500 border-r border-b border-gray-200 text-[11px] italic">
                        {sr.remarks || '—'}
                      </td>
                    )}

                    {/* Teacher */}
                    <td className="px-3 py-2.5 text-gray-500 border-b border-gray-200 text-[11px]">
                      {s.show_subject_teacher_initials ? initials(sr.teacher_name) : (sr.teacher_name || '—')}
                    </td>
                  </tr>
                );
              })
            )}

            {/* ── Footer row: overall average ── */}
            {subject_reports.length > 0 && (
              <tr className="bg-gray-100 font-bold">
                <td
                  colSpan={1 + maxPapers}
                  className="px-4 py-2.5 text-right text-gray-600 border-r border-gray-200 text-[10px] uppercase tracking-widest"
                >
                  Overall Average
                </td>
                <td className="px-3 py-2.5 text-center text-sm font-black border-r border-gray-200" style={{ color: accentColor }}>
                  {overallAvg}%
                </td>
                <td colSpan={s.show_teacher_comment ? 3 : 2} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paper Legend ── */}
      {s.show_identifier_legend && maxPapers > 0 && subject_reports.length > 0 && (() => {
        // Collect paper names from the first subject that has papers
        const firstWithPapers = subject_reports.find(sr => sr.competency_scores.some(c => c.assessment_type === 'exam'));
        const paperNames = firstWithPapers?.competency_scores.filter(c => c.assessment_type === 'exam') ?? [];
        if (!paperNames.length) return null;
        return (
          <div className="mb-6 border border-gray-100 rounded-xl p-4 bg-gray-50/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Paper Key</p>
            <div className="flex gap-6 flex-wrap">
              {paperNames.map((p, i) => (
                <span key={i} className="text-xs text-gray-600 font-medium">
                  <span className="font-bold text-gray-800">Paper {i + 1}</span> – {p.competency_name}{' '}
                  <span className="text-gray-400">(max: {p.max_score})</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Official Remarks ── */}
      {(s.show_class_teacher_remarks || s.show_head_teacher_remarks) && (
        <div className="mb-8 border-2 border-gray-100 rounded-2xl p-5 relative">
          <div className="absolute -top-3 left-4 bg-white px-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Remarks</p>
          </div>
          <div className="space-y-4">
            {s.show_class_teacher_remarks && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Class Teacher&apos;s Remarks</p>
                <p className="text-sm font-medium text-gray-900 italic border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                  &ldquo;{reportCard.class_teacher_remarks || 'A commendable performance.'}&rdquo;
                </p>
              </div>
            )}
            {s.show_head_teacher_remarks && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Head Teacher&apos;s Remarks</p>
                <p className="text-sm font-medium text-gray-900 italic border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
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
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class Teacher</p>
            </div>
          )}
          {s.show_head_teacher_signature && (
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Head Teacher</p>
            </div>
          )}
          {s.show_parent_signature && (
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent / Guardian</p>
            </div>
          )}
        </div>
      )}

      {/* ── Grade Key ── */}
      {s.show_grade_descriptor && gradingSystem && gradingSystem.boundaries.length > 0 && (
        <div className="mt-8 mb-8">
          <div className="mb-3 border-b-2 pb-1" style={{ borderColor: `${primaryColor}20` }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">A-Level Grading Scale</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-tighter">
                  <th className="px-3 py-2 text-left border-r border-gray-200 w-20">Grade</th>
                  {s.show_grade_descriptor_score_range && <th className="px-3 py-2 text-center border-r border-gray-200 w-28">% Range</th>}
                  <th className="px-3 py-2 text-left">Descriptor</th>
                </tr>
              </thead>
              <tbody>
                {gradingSystem.boundaries.slice().sort((a, b) => b.min_score - a.min_score).map((b, i) => (
                  <tr key={b.id} className={i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                    <td className="px-3 py-2 border-r border-gray-200">
                      <span className={`inline-block px-2 py-0.5 rounded font-black ${aLevelGradeColor(b.grade)}`}>{b.grade}</span>
                    </td>
                    {s.show_grade_descriptor_score_range && (
                      <td className="px-3 py-2 text-center border-r border-gray-200 font-bold text-gray-600">
                        {Math.round(b.min_score)}% – {Math.round(b.max_score)}%
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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">School Closed On</p>
            <p className="text-sm font-bold text-gray-800">{fmtDate(s.school_closed_on)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Next Term Begins On</p>
            <p className="text-sm font-bold text-gray-800">{fmtDate(s.next_term_begins_on)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
