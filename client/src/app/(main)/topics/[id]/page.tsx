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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <Card className="p-8"><Skeleton className="h-64 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-gray-50"
            onClick={() => router.push('/topics')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3">
                {topic.subject_name || `Subject ID: ${topic.subject}`}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none px-3">
                {topic.class_name || `Class ID: ${topic.class_obj}`}
              </Badge>
            </div>
          </div>
        </div>
        <Button 
          className="h-11 rounded-xl shadow-lg shadow-blue-200"
          onClick={() => router.push(`/topics/${id}/edit`)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Topic
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-lg">Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
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
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-500" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Activities</span>
                <span className="font-bold text-gray-900">{topic.activities_count || 0}</span>
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
  );
}
