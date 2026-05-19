'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '@iconify/react';
import { 
  ChevronLeft, 
  BookMarked, 
  Hash, 
  FileText,
  Loader2,
  Plus,
  Award,
  BookOpen,
  Edit2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Input, 
  Label, 
  ErrorMessage,
  Skeleton,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui';
import { 
  SubjectPaperSchema,
  ISubjectPaperInput,
  ISubjectPaperListResponse
} from '@/features/members/members.schemas';
import { 
  FetchSubjectById, 
  FetchSubjectPapers,
  CreateSubjectPaper,
  UpdateSubjectPaper,
  DeleteSubjectPaper
} from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { PaginatedTable, ColumnDef } from '@/components/tables/paginated-table';
import { getPaginatedFromUrl } from '@/lib/utils';
import { IPaginatedResponse } from '@/types';

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fetchingSubject, setFetchingSubject] = useState(true);
  const [subject, setSubject] = useState<any>(null);

  // Subject Paper Modal State
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ISubjectPaperListResponse | null>(null);
  const [paperLoading, setPaperLoading] = useState(false);
  
  const paperTableRefreshRef = useRef<any>(null);

  // Form for Subject Paper
  const {
    register: registerPaper,
    handleSubmit: handleSubmitPaper,
    setValue: setValuePaper,
    watch: watchPaper,
    reset: resetPaper,
    formState: { errors: paperErrors },
  } = useForm<ISubjectPaperInput>({
    resolver: zodResolver(SubjectPaperSchema),
    defaultValues: {
      subject: Number(id),
      name: '',
      code: '',
      max_score: 100,
      is_active: true
    }
  });

  const isPaperActive = watchPaper('is_active');

  const loadSubject = async () => {
    setFetchingSubject(true);
    const result = await FetchSubjectById(id);
    if (result.success) {
      setSubject(result.data);
    } else {
      toast.error("Failed to load subject details");
      router.push('/subjects');
    }
    setFetchingSubject(false);
  };

  useEffect(() => {
    loadSubject();
  }, [id, router]);

  // Subject Paper Actions
  const handleOpenAddModal = () => {
    setEditingPaper(null);
    resetPaper({
      subject: Number(id),
      name: '',
      code: '',
      max_score: 100,
      is_active: true
    });
    setIsPaperModalOpen(true);
  };

  const handleOpenEditModal = (paper: ISubjectPaperListResponse) => {
    setEditingPaper(paper);
    resetPaper({
      subject: Number(id),
      name: paper.name,
      code: paper.code || '',
      max_score: paper.max_score,
      is_active: paper.is_active
    });
    setIsPaperModalOpen(true);
  };

  const handleDeletePaper = async (paperId: number) => {
    if (confirm("Are you sure you want to delete this subject paper?")) {
      const res = await DeleteSubjectPaper(paperId);
      if (res.success) {
        toast.success("Subject paper deleted successfully");
        paperTableRefreshRef.current?.();
      } else {
        toast.error("Failed to delete subject paper");
      }
    }
  };

  const onSubmitPaper = async (data: ISubjectPaperInput) => {
    setPaperLoading(true);
    let result;
    if (editingPaper) {
      result = await UpdateSubjectPaper(editingPaper.id, data);
    } else {
      result = await CreateSubjectPaper(data);
    }

    if (result.success) {
      toast.success(editingPaper ? "Subject paper updated successfully" : "Subject paper created successfully");
      setIsPaperModalOpen(false);
      paperTableRefreshRef.current?.();
    } else {
      toast.error("Failed to save subject paper");
    }
    setPaperLoading(false);
  };

  const fetchSubjectPapersList = async (query?: any): Promise<IPaginatedResponse<ISubjectPaperListResponse>> => {
    const res = await FetchSubjectPapers({ ...query, subject_id: id });
    if ('error' in res) {
      return { count: 0, next: null, previous: null, results: [] };
    }
    return res;
  };

  const fetchFromUrlWrapper = async ({ url }: { url: string }): Promise<IPaginatedResponse<ISubjectPaperListResponse>> => {
    const res = await getPaginatedFromUrl<ISubjectPaperListResponse>({ url });
    return res;
  };

  // Subject Papers Table Columns
  const columns: ColumnDef<ISubjectPaperListResponse>[] = [
    {
      key: "name",
      header: "Paper Name",
      cell: (paper) => (
        <div className="font-bold flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{paper.name}</p>
            <p className="text-xs text-gray-400">Code: {paper.code || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    {
      key: "max_score",
      header: "Max Score",
      cell: (paper) => (
        <span className="font-medium text-gray-600">{paper.max_score} marks</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (paper) => (
        paper.is_active ? (
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-3 py-1 rounded-full w-fit">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none px-3 py-1 rounded-full font-bold w-fit">
            Inactive
          </Badge>
        )
      ),
    },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      cell: (paper) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon icon="hugeicons:more-vertical-circle-01" className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-100">
              <DropdownMenuItem 
                className="cursor-pointer py-2"
                onClick={() => handleOpenEditModal(paper)}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2 text-rose-600 focus:text-rose-600"
                onClick={() => handleDeletePaper(paper.id)}
              >
                <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (fetchingSubject) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1"><Skeleton className="h-64 w-full rounded-xl" /></div>
          <div className="md:col-span-2"><Skeleton className="h-80 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border-gray-200 hover:bg-gray-50"
            onClick={() => router.push('/subjects')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{subject?.name}</h1>
            <p className="text-gray-500 mt-1">Detailed information and paper curriculum management.</p>
          </div>
        </div>
        <Button 
          className="h-11 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold px-6 shadow-sm flex items-center gap-2"
          onClick={() => router.push(`/subjects/${id}/edit`)}
        >
          <Edit2 className="w-4 h-4" />
          Edit Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Subject Overview Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-emerald-500" />
              Subject Overview
            </h2>

            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Subject Name</span>
                <p className="text-base font-bold text-gray-900">{subject?.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Subject Code</span>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-500" />
                  <p className="text-base font-mono font-bold text-gray-900">{subject?.code}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Status</span>
                <div>
                  {subject?.is_active ? (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold px-3 py-1 rounded-full w-fit flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-none px-3 py-1 rounded-full font-bold w-fit flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Inactive
                    </Badge>
                  )}
                </div>
              </div>

              {subject?.description && (
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Description</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{subject?.description}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Papers Section */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-white">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subject Papers</h2>
                <p className="text-sm text-gray-500 mt-1">List of component papers graded under this subject (e.g., P1, P2).</p>
              </div>
              <Button 
                className="rounded-xl h-11 bg-primary text-white hover:bg-primary/80 font-bold px-6 shadow-sm"
                onClick={handleOpenAddModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Paper
              </Button>
            </div>

            <div className="overflow-x-auto">
              <PaginatedTable<ISubjectPaperListResponse>
                fetchFirstPage={fetchSubjectPapersList}
                fetchFromUrl={getPaginatedFromUrl}
                columns={columns}
                refreshRef={paperTableRefreshRef}
                showRowNumbers={true}
                emptyState={
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">No subject papers found</h3>
                      <p className="text-sm text-gray-500">Add papers to this subject to start entering paper-level marks.</p>
                    </div>
                  </div>
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Add / Edit Paper Dialog */}
      <Dialog open={isPaperModalOpen} onOpenChange={setIsPaperModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingPaper ? "Edit Subject Paper" : "Add Subject Paper"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Fill in the paper details. These are graded individually.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPaper(onSubmitPaper)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="paper-name" className="text-sm font-semibold text-gray-700">
                Paper Name
              </Label>
              <Input 
                id="paper-name"
                placeholder="e.g., Paper 1 (Pure Mathematics)" 
                className={`h-11 rounded-xl border-gray-200 focus:ring-emerald-500 ${paperErrors.name ? 'border-red-500' : ''}`}
                {...registerPaper('name')}
              />
              {paperErrors.name && <ErrorMessage message={paperErrors.name.message} />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paper-code" className="text-sm font-semibold text-gray-700">
                  Paper Code
                </Label>
                <Input 
                  id="paper-code"
                  placeholder="e.g., P1" 
                  className={`h-11 rounded-xl border-gray-200 focus:ring-emerald-500 ${paperErrors.code ? 'border-red-500' : ''}`}
                  {...registerPaper('code')}
                />
                {paperErrors.code && <ErrorMessage message={paperErrors.code.message} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paper-max-score" className="text-sm font-semibold text-gray-700">
                  Max Score
                </Label>
                <Input 
                  id="paper-max-score"
                  type="number"
                  placeholder="e.g., 100" 
                  className={`h-11 rounded-xl border-gray-200 focus:ring-emerald-500 ${paperErrors.max_score ? 'border-red-500' : ''}`}
                  {...registerPaper('max_score', { valueAsNumber: true })}
                />
                {paperErrors.max_score && <ErrorMessage message={paperErrors.max_score.message} />}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                <p className="text-xs text-gray-500">Available for marking sheets</p>
              </div>
              <Switch 
                checked={isPaperActive}
                onCheckedChange={(val) => setValuePaper('is_active', val)}
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                className="h-11 rounded-xl flex-1 border-gray-200 text-gray-600"
                onClick={() => setIsPaperModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-11 rounded-xl flex-1 bg-primary text-white font-bold"
                disabled={paperLoading}
              >
                {paperLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  editingPaper ? "Save Changes" : "Add Paper"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
