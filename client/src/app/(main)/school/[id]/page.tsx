'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Mail, Phone, MapPin, Edit2, ArrowLeft,
  CheckCircle2, XCircle, Quote, Image as ImageIcon,
  GraduationCap, Users, BookOpen, CalendarDays
} from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { FetchSchoolById } from '@/features/school/school.service';
import { toast } from 'sonner';
import Link from 'next/link';

interface SchoolDetail {
  id: number;
  public_id: string;
  name: string;
  email?: string;
  phone_number?: string;
  address?: string;
  motto?: string;
  logo?: string;
  active: boolean;
  level?: string;
  campus?: number;
  campus_name?: string;
  report_primary_color?: string;
  report_accent_color?: string;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function formatImgUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Ensure we don't have double slashes
  const baseUrl = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FetchSchoolById(id).then(res => {
      if (res.success) setSchool(res.data);
      else { toast.error('Failed to load school'); router.push('/school'); }
      setLoading(false);
    });
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-8 w-64" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div><Skeleton className="h-72 w-full rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (!school) return null;

  const primaryColor = school.report_primary_color || '#185FA5';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-full border-gray-200" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5 font-mono">ID: {school.public_id?.slice(0, 16)}…</p>
          </div>
        </div>
        <Button asChild className="rounded-xl h-10 gap-2 shadow-sm">
          <Link href={`/school/${id}/edit`}><Edit2 className="w-4 h-4" /> Edit School</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left — main info */}
        <div className="md:col-span-2 space-y-6">

          {/* Identity card */}
          <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
            {/* Top banner strip */}
            <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} />
            <div className="p-6 flex items-start gap-5">
              {/* Logo / Avatar */}
              <div className="w-20 h-20 rounded-2xl border-2 border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {school.logo
                  ? <img src={formatImgUrl(school.logo) || ''} alt={school.name} className="w-full h-full object-contain" />
                  : <Building2 className="w-8 h-8 text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-gray-900">{school.name}</h2>
                  <Badge className={`rounded-full text-[10px] font-bold border-none ${school.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-600 hover:bg-red-100'}`}>
                    {school.active ? <><CheckCircle2 className="w-3 h-3 mr-1 inline" />Active</> : <><XCircle className="w-3 h-3 mr-1 inline" />Inactive</>}
                  </Badge>
                  {school.level && (
                    <Badge 
                      className={`rounded-full text-[10px] font-bold capitalize border-none ${
                        school.level === 'primary' 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                          : school.level === 'secondary'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {school.level}
                    </Badge>
                  )}
                </div>
                {school.motto && (
                  <p className="text-sm italic text-gray-500 mt-1 flex items-start gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                    {school.motto}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {school.report_primary_color && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: school.report_primary_color }} />
                      <span className="text-[10px] text-gray-400 font-mono">{school.report_primary_color}</span>
                    </div>
                  )}
                  {school.report_accent_color && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: school.report_accent_color }} />
                      <span className="text-[10px] text-gray-400 font-mono">{school.report_accent_color}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Contact & Location */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-400">Contact & Location</h3>
            <InfoRow icon={Mail} label="Email Address" value={school.email} />
            <InfoRow icon={Phone} label="Phone Number" value={school.phone_number} />
            <InfoRow icon={MapPin} label="Physical Address" value={school.address} />
            {!school.email && !school.phone_number && !school.address && (
              <p className="text-sm text-gray-400 italic py-4 text-center">No contact information provided.</p>
            )}
          </Card>

          {/* Report Card Branding */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-400">Report Card Branding</h3>
            <div className="space-y-3">
              {/* Logo preview full */}
              {school.logo ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <img src={formatImgUrl(school.logo) || ''} alt="School logo" className="w-14 h-14 object-contain rounded-lg" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">School Logo</p>
                    <p className="text-sm text-gray-600">Used in report card header &amp; watermark</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <ImageIcon className="w-5 h-5 text-gray-300" />
                  <p className="text-sm text-gray-400">No logo uploaded yet. <Link href={`/school/${id}/edit`} className="text-indigo-500 hover:underline">Add one →</Link></p>
                </div>
              )}

              {/* Color swatches */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-gray-100" style={{ backgroundColor: `${primaryColor}08` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Header Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: primaryColor }} />
                    <span className="text-sm font-mono font-bold text-gray-700">{primaryColor}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-gray-100" style={{ backgroundColor: `${school.report_accent_color || '#4f46e5'}08` }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Accent Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: school.report_accent_color || '#4f46e5' }} />
                    <span className="text-sm font-mono font-bold text-gray-700">{school.report_accent_color || '#4f46e5'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="p-5 border-none shadow-sm ring-1 ring-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl gap-2 text-sm" asChild>
                <Link href={`/school/${id}/edit`}><Edit2 className="w-4 h-4 text-indigo-500" /> Edit Details</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl gap-2 text-sm" asChild>
                <Link href="/reports"><GraduationCap className="w-4 h-4 text-emerald-500" /> View Reports</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl gap-2 text-sm" asChild>
                <Link href="/members/students"><Users className="w-4 h-4 text-blue-500" /> Manage Students</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-10 rounded-xl gap-2 text-sm" asChild>
                <Link href="/members/subjects"><BookOpen className="w-4 h-4 text-amber-500" /> Subjects</Link>
              </Button>
            </div>
          </Card>

          {/* Meta info */}
          <Card className="p-5 border-none shadow-sm ring-1 ring-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Record Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Created</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(school.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Last Updated</p>
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(school.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {school.campus_name && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Campus</p>
                  <p className="text-sm text-gray-700">{school.campus_name}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
