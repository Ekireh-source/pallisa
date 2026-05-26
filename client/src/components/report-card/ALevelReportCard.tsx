'use client';

import React, { useEffect, useState } from 'react';
import { ReportCard, ReportCardSettings, School } from '@/types';
import { FetchGradingSystems, FetchGradingSystemById } from '@/features/reports/reports.service';
import { QrCode, User } from 'lucide-react';

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
  if (!grade) return 'bg-gray-100 text-gray-700 border-gray-250';
  const g = grade.toUpperCase();
  if (g === 'A') return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
  if (g === 'B') return 'bg-teal-50 text-teal-800 border border-teal-300';
  if (g === 'C') return 'bg-sky-50 text-sky-800 border border-sky-300';
  if (g === 'D') return 'bg-blue-50 text-blue-800 border border-blue-300';
  if (g === 'E') return 'bg-indigo-50 text-indigo-800 border border-indigo-300';
  if (g === 'O') return 'bg-orange-50 text-orange-800 border border-orange-300';
  if (g === 'F') return 'bg-rose-50 text-rose-800 border border-rose-300';

  // Individual paper sub-grades (D1, C5, P7, F9, etc.)
  if (g.startsWith('D')) return 'bg-emerald-50/50 text-emerald-700 border border-emerald-200';
  if (g.startsWith('C')) return 'bg-blue-50/50 text-blue-700 border border-blue-200';
  if (g.startsWith('P')) return 'bg-amber-50/50 text-amber-700 border border-amber-200';
  if (g.startsWith('F')) return 'bg-rose-50/50 text-rose-700 border border-rose-200';

  return 'bg-gray-50 text-gray-700 border border-gray-200';
}

/** Generates standard contextual Ugandan A-Level paper comments based on scores. */
function getPaperComment(paper: any) {
  if (paper.remarks) return paper.remarks;
  if (paper.comment) return paper.comment;
  if (paper.description) return paper.description;

  const score = Number(paper.score || 0);
  if (score >= 80) return 'Excellent performance.';
  if (score >= 75) return 'Very good performance.';
  if (score >= 70) return 'Good performance.';
  if (score >= 65) return 'There\'s room for improvement.';
  if (score >= 52) return 'Average performance, aim higher.';
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
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


      {/* ── Attendance Bar ── */}
      {s.show_attendance && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total School Days', value: reportCard.attendance_total_days },
            { label: 'Days Present',      value: reportCard.attendance_days_present },
            { label: 'Days Absent',       value: daysAbsent },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[12px] border border-gray-150 p-3 text-center bg-gray-50/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--My-Gray)] mb-0.5">{label}</p>
              <p className="text-base font-black text-[var(--My-Black)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table: Organized exactly as requested (Vertical papers, single Grade column for subject average, comment for each paper) ── */}
      <div className="mb-8 overflow-x-auto rounded-[12px] border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse min-w-[750px]">
          <thead>
            <tr className="text-white uppercase font-bold text-xs" style={{ backgroundColor: primaryColor }}>
              <th className="px-4 py-3 text-left border-r border-blue-400" style={{ borderColor: `${primaryColor}aa` }}>Subjects</th>
              <th className="px-3 py-3 text-center border-r border-blue-400 w-24" style={{ borderColor: `${primaryColor}aa` }}>Paper</th>
              <th className="px-3 py-3 text-center border-r border-blue-400 w-24" style={{ borderColor: `${primaryColor}aa` }}>Marks</th>
              <th className="px-3 py-3 text-center border-r border-blue-400 w-24" style={{ borderColor: `${primaryColor}aa` }}>Grade</th>
              <th className="px-4 py-3 text-left border-r border-blue-400" style={{ borderColor: `${primaryColor}aa` }}>Comment</th>
              <th className="px-4 py-3 text-left w-48">Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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

                // Handle subjects that have no individual papers recorded yet
                if (paperCount === 0) {
                  return (
                    <tr key={sr.id} className={sIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                      {/* Subject Name */}
                      <td className="px-4 py-3 font-bold text-[var(--My-Black)] border-r border-gray-200 align-middle">
                        <div className="text-xs uppercase tracking-wide">{sr.subject_name}</div>
                        {sr.subject_code && <div className="text-[10px] text-[var(--My-Gray)] font-normal">{sr.subject_code}</div>}
                      </td>
                      {/* Paper */}
                      <td className="px-3 py-3 text-center text-[var(--My-Gray)] border-r border-gray-200 font-medium">—</td>
                      {/* Marks */}
                      <td className="px-3 py-3 text-center text-[var(--My-Gray)] border-r border-gray-200 font-bold">—</td>
                      {/* Grade */}
                      <td className="px-3 py-3 text-center border-r border-gray-200 align-middle">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-black tracking-wide ${aLevelGradeColor(sr.grade)}`}>
                          {sr.grade || '—'}
                        </span>
                      </td>
                      {/* Comment */}
                      <td className="px-4 py-3 text-[var(--My-Gray)] border-r border-gray-200 text-xs italic align-middle">
                        {sr.remarks || '—'}
                      </td>
                      {/* Teacher */}
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold align-middle">
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
                        <tr key={paper.id} className={sIdx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'}>
                          {/* Subject cell (spanned across all paper rows of this subject) */}
                          {isFirst && (
                            <td rowSpan={paperCount} className="px-4 py-3.5 font-bold text-[var(--My-Black)] border-r border-gray-200 align-middle">
                              <div className="text-xs uppercase tracking-wider text-[var(--My-Black)]">{sr.subject_name}</div>
                              {sr.subject_code && <div className="text-[9px] text-[var(--My-Gray)] font-normal mt-0.5">{sr.subject_code}</div>}
                            </td>
                          )}

                          {/* Paper Name/Code */}
                          <td className="px-3 py-2.5 text-center text-gray-700 border-r border-gray-200 font-bold text-xs align-middle">
                            {paper.competency_name ? paper.competency_name.split(' (')[0] : `Paper ${pIdx + 1}`}
                          </td>

                          {/* Paper Mark */}
                          <td className="px-3 py-2.5 text-center border-r border-gray-200 font-black text-xs text-[var(--My-Black)] align-middle">
                            {paperMark.toFixed(0)}%
                          </td>

                          {/* Overall Subject Grade cell (spanned across all paper rows of this subject) */}
                          {isFirst && (
                            <td rowSpan={paperCount} className="px-3 py-3 text-center border-r border-gray-200 align-middle">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className={`inline-block px-3 py-1 rounded-md text-sm font-black tracking-widest ${aLevelGradeColor(sr.grade)}`}>
                                  {sr.grade || '—'}
                                </span>
                                <span className="text-[8px] text-[var(--My-Gray)] uppercase tracking-wider font-bold">Subject Grade</span>
                              </div>
                            </td>
                          )}

                          {/* Paper Comment */}
                          <td className="px-4 py-2.5 text-[var(--My-Gray)] border-r border-gray-200 text-xs italic align-middle leading-relaxed">
                            {paperComment}
                          </td>

                          {/* Teacher cell (spanned across all paper rows of this subject) */}
                          {isFirst && (
                            <td rowSpan={paperCount} className="px-4 py-3 text-gray-700 text-xs font-semibold border-gray-200 align-middle">
                              <div className="uppercase tracking-wide leading-tight text-[var(--My-Black)]">
                                {s.show_subject_teacher_initials ? initials(sr.teacher_name) : (sr.teacher_name || '—')}
                              </div>
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

      {/* ── Bottom Section: Charts, Remarks, Dates & Qr ── */}
      {s.show_grade_descriptor && activeGradingSystem && activeGradingSystem.boundaries.length > 0 && (
        <div className="mt-8 mb-8 pr-12">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pr-12">
        
      

        {/* Right Side: Remarks & QR profile */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Remarks Section */}
          <div className="border border-gray-200/80 rounded-[12px] p-5 relative bg-white">
            <div className="absolute -top-3 left-4 bg-white px-2.5">
              <p className="text-[10px] font-black text-[var(--My-Gray)] uppercase tracking-widest">Official Remarks</p>
            </div>
            <div className="space-y-4 pt-1">
              
              {/* Class Teacher */}
              {s.show_class_teacher_remarks && (
                <div className="border-b border-gray-100/50 pb-3">
                  <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-wider mb-1">
                    {reportCard.class_teacher_name || 'Class Teacher'}
                  </p>
                  <p className="text-xs font-semibold text-[var(--My-Black)] italic leading-relaxed border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                    &ldquo;{reportCard.class_teacher_remarks || 'You\'re making a good start! Keep practicing and believe in yourself.'}&rdquo;
                  </p>
                  <div className="mt-2.5 flex justify-end">
                    <span className="text-[9px] text-gray-300 font-bold italic">Class Teacher Signature: __________________</span>
                  </div>
                </div>
              )}

              {/* House Teacher */}
              <div>
                <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-wider mb-1">House Teacher</p>
                <p className="text-xs font-semibold text-gray-300 italic">....................................................................................</p>
              </div>

              {/* Head Teacher */}
              {s.show_head_teacher_remarks && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-wider mb-1">Head Teacher</p>
                  <p className="text-xs font-semibold text-[var(--My-Black)] italic leading-relaxed border-l-2 pl-3" style={{ borderLeftColor: primaryColor }}>
                    &ldquo;{reportCard.head_teacher_remarks || 'While you\'ve met basic standards, more practice and focus on skills will benefit you. Stay focused and keep working hard!'}&rdquo;
                  </p>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="border-b border-gray-300 w-1/3 h-5 mb-1" />
                    <span className="text-[9px] text-gray-300 font-bold italic">Head Teacher Signature & Stamp</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Profile QR Code */}
          <div className="rounded-[12px] border border-blue-100 p-4 bg-gradient-to-br from-blue-50/10 to-white flex items-center gap-4">
            <div className="shrink-0 bg-white p-2 rounded-[12px] border border-blue-100">
              <QrCode size={40} className="stroke-[1.2] text-[#0288d1]" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-gray-700 leading-snug">Scan to access your interactive student profile.</p>
              <p className="text-[var(--My-Gray)] font-medium mt-1">
                Your username: <span className="font-black text-blue-900">{reportCard.student_id_code}@{school?.name?.replace(/\s+/g, '').toLowerCase() || 'mayangapsss'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Motto Block ── */}
      <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end items-center">
        <div className="flex items-center">
          <div className="w-10 h-3 bg-[#2e7d32]" />
          <div className="bg-[#0288d1] text-white py-1 px-4 text-[10px] font-black italic tracking-widest">
            School Motto: {school?.motto || 'EDUCATION IS THE KEY'}
          </div>
        </div>
      </div>
    </div>
  );
}
