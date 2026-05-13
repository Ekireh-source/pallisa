'use client';

import React, { useEffect, useState, use } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { FetchReportCardById } from '@/features/reports/reports.service';
import { ReportCard } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppSelector } from '@/store';

interface PageProps {
  params: Promise<{ id: string }>;
}

function gradeColorClass(grade?: string) {
  if (!grade) return 'bg-gray-100 text-gray-800';
  if (['D1', 'D2'].includes(grade)) return 'bg-emerald-100 text-emerald-800';
  if (['C3', 'C4', 'C5', 'C6'].includes(grade)) return 'bg-blue-100 text-blue-800';
  if (['P7', 'P8'].includes(grade)) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800'; // F9
}

export default function ReportCardDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);

  const school = useAppSelector((state) => state.auth.school);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await FetchReportCardById(id);
      if (res.success) {
        setReportCard(res.data);
      } else {
        toast.error('Failed to load report card');
        router.back();
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-8">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!reportCard) return null;

  const { subject_reports } = reportCard;

  const maxAois = Math.max(...subject_reports.map(s => s.competency_scores.filter(c => c.assessment_type === 'aoi').length), 0);
  const totalAoi = subject_reports.reduce((acc, s) => acc + Number(s.aoi_score || 0), 0);
  const totalExam = subject_reports.reduce((acc, s) => acc + Number(s.exam_score || 0), 0);
  const totalCum = totalAoi + totalExam;
  const maxTotal = subject_reports.length * 100;
  const calculatedAverage = subject_reports.length > 0 ? (totalCum / subject_reports.length).toFixed(1) : '0';

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Action Bar (Not printed) */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          className="gap-2 rounded-2xl"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
          <Printer className="w-4 h-4" />
          Print Report Card
        </Button>
      </div>

      {/* Printable Report Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-[#185FA5] pb-6 mb-8">
          <div className="flex-shrink-0">
            <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width={60} height={60}>
              <circle cx="15" cy="8" r="4" fill="#185FA5" />
              <path d="M15 13 L6 18 L15 23 L24 18 Z" fill="#185FA5" />
              <rect x="12" y="23" width="6" height="4" rx="1" fill="#185FA5" />
            </svg>
          </div>
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl md:text-3xl font-black text-[#185FA5] uppercase tracking-wider">
              {school?.name || 'School Name Not Set'}
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
              {school?.address ? `${school.address} · ` : ''}Academic Report Card
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-[#185FA5] text-[#185FA5] rounded-lg px-4 py-2 font-black text-sm uppercase">
              {reportCard.term_name}<br />
              {reportCard.academic_year_name}
            </div>
          </div>
        </div>

        {/* Student Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{reportCard.student_name}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admission No.</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{reportCard.student_id_code}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class / Stream</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{reportCard.class_name} · {reportCard.stream_name}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Teacher</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{reportCard.class_teacher_name || '—'}</p>
          </div>
        </div>

        {/* Marks Table */}
        <div className="mb-10 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#185FA5] text-white">
                <th className="px-4 py-3 text-left font-bold border-r border-[#15508a]">Subject</th>
                {Array.from({ length: Math.max(1, maxAois) }).map((_, idx) => (
                  <th key={idx} className="px-2 py-3 text-center font-bold border-r border-[#15508a]">
                    AOI {idx + 1}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-bold border-r border-[#15508a]">AOI<br /><span className="text-[10px] font-normal opacity-80">/20</span></th>
                <th className="px-3 py-3 text-center font-bold border-r border-[#15508a]">Exam<br /><span className="text-[10px] font-normal opacity-80">/80</span></th>
                <th className="px-3 py-3 text-center font-bold border-r border-[#15508a]">Total<br /><span className="text-[10px] font-normal opacity-80">/100</span></th>
                <th className="px-3 py-3 text-center font-bold border-r border-[#15508a]">Grd</th>
                <th className="px-4 py-3 text-left font-bold border-r border-[#15508a]">Remarks</th>
                <th className="px-4 py-3 text-left font-bold">Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subject_reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 italic">
                    No subject results recorded.
                  </td>
                </tr>
              ) : (
                subject_reports.map((s, i) => {
                  const aois = s.competency_scores.filter(c => c.assessment_type === 'aoi');
                  return (
                    <tr key={s.id} className={i % 2 === 1 ? "bg-gray-50/80" : "bg-white"}>
                      <td className="px-4 py-3 font-bold text-gray-900 border-r border-b border-gray-200">{s.subject_name}</td>
                      {Array.from({ length: Math.max(1, maxAois) }).map((_, idx) => (
                        <td key={idx} className="px-3 py-3 text-center font-medium text-gray-700 border-r border-b border-gray-200">
                          {aois[idx]?.score ?? '—'}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center font-medium text-gray-700 border-r border-b border-gray-200">{s.aoi_score}</td>
                      <td className="px-3 py-3 text-center font-medium text-gray-700 border-r border-b border-gray-200">{s.exam_score}</td>
                      <td className="px-3 py-3 text-center font-black text-gray-900 border-r border-b border-gray-200">{Number(s.aoi_score || 0) + Number(s.exam_score || 0)}</td>
                      <td className="px-3 py-3 text-center border-r border-b border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-extrabold ${gradeColorClass(s.grade)}`}>
                          {s.grade || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-medium border-r border-b border-gray-200">{s.remarks || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-medium border-b border-gray-200">{s.teacher_name || '—'}</td>
                    </tr>
                  );
                })
              )}
              {subject_reports.length > 0 && (
                <tr className="bg-gray-100">
                  <td colSpan={1 + Math.max(1, maxAois)} className="px-4 py-3 text-right font-black text-gray-900 border-r border-gray-200 uppercase tracking-widest text-xs">Totals</td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900 border-r border-gray-200">{totalAoi}</td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900 border-r border-gray-200">{totalExam}</td>
                  <td className="px-3 py-3 text-center font-black text-indigo-700 text-base border-r border-gray-200">{totalCum}</td>
                  <td colSpan={3} className="px-4 py-3 border-gray-200"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Marks</p>
            <p className="text-xl font-black text-indigo-900 mt-1">{totalCum} <span className="text-sm font-bold text-indigo-400">/ {maxTotal}</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Average</p>
            <p className="text-xl font-black text-indigo-900 mt-1">{calculatedAverage}%</p>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Class Position</p>
            <p className="text-xl font-black text-indigo-900 mt-1">
              {reportCard.position ? `${reportCard.position} ` : '— '}
              {reportCard.out_of ? <span className="text-sm font-bold text-indigo-400">/ {reportCard.out_of}</span> : ''}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Aggregate (Div)</p>
            <p className="text-xl font-black text-indigo-900 mt-1">{reportCard.overall_grade || '—'}</p>
          </div>
        </div>

        {/* Remarks Box */}
        <div className="mb-12 border-2 border-gray-100 rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-4 bg-white px-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Official Remarks</p>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class Teacher&apos;s Remarks</p>
              <p className="text-sm font-medium text-gray-900 italic border-l-2 border-[#185FA5] pl-3">
                &quot;{reportCard.class_teacher_remarks || 'A promising performance.'}&quot;
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Head Teacher&apos;s Remarks</p>
              <p className="text-sm font-medium text-gray-900 italic border-l-2 border-[#185FA5] pl-3">
                &quot;{reportCard.head_teacher_remarks || 'Promoted to the next class.'}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t-[3px] border-gray-100 mt-auto">
          <div className="text-center">
            <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-3"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-3"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Head Teacher</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-300 w-3/4 mx-auto h-8 mb-3"></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Parent / Guardian</p>
          </div>
        </div>
      </div>
    </div>
  );
}
