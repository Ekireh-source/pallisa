'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Edit2,
  BookOpen,
  Layers,
  FileText,
  Calendar,
  User,
  BookMarked
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Skeleton
} from '@/components/ui';
import { FetchTopicById } from '@/features/exam/exam.service';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [topic, setTopic] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadTopic = async () => {
      setLoading(true);
      const result = await FetchTopicById(id);
      if (result.success) {
        setTopic(result.data);
      } else {
        router.push('/topics');
      }
      setLoading(false);
    };
    loadTopic();
  }, [id, router]);

  if (loading) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
      </div>
    );
  }

  return (
    <MainLayout
      title={
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{topic?.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-3 hover:bg-white/20">
              {topic?.subject_name || `Subject ID: ${topic?.subject}`}
            </Badge>
            <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 px-3 hover:bg-emerald-400/30">
              {topic?.class_name || `Class ID: ${topic?.class_obj}`}
            </Badge>
          </div>
        </div>
      }
      backButton={
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl h-12 w-12 hover:bg-white/20 text-white transition-all mr-2"
          onClick={() => router.push('/topics')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      headerActions={
        <Button
          className="h-11 rounded-xl bg-white text-primary hover:bg-gray-100 font-bold px-6  flex items-center gap-2 border border-transparent"
          onClick={() => router.push(`/topics/${id}/edit`)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Topic
        </Button>
      }
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[24px]">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none  ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-My-Black text-lg">Description</h3>
                    <p className="text-My-Black leading-relaxed whitespace-pre-wrap">
                      {topic.description || "No description provided for this topic."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created on {format(new Date(topic.created_at), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4" />
                    Topic ID: {id}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-none  ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-My-Black mb-4 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-primary" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Activities</span>
                  <span className="font-bold text-My-Black">{topic.activities_count || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Avg. Score</span>
                  <span className="font-bold text-primary">--</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
