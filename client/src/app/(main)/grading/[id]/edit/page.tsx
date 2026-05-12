'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ChevronLeft,
  Save,
  Layers,
  Loader2,
  ToggleLeft,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui';
import {
  FetchGradingSystemById,
  UpdateGradingSystem,
  CreateGradeBoundary,
  UpdateGradeBoundary,
  DeleteGradeBoundary
} from '@/features/reports/reports.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { GradingSystem, GradeBoundary } from '@/types';

export default function EditGradingSystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [system, setSystem] = useState<GradingSystem | null>(null);

  // Boundary modal state
  const [boundaryModalOpen, setBoundaryModalOpen] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState<GradeBoundary | null>(null);
  const [boundarySaving, setBoundarySaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  const {
    register: registerBoundary,
    handleSubmit: handleSubmitBoundary,
    reset: resetBoundary,
    formState: { errors: boundaryErrors }
  } = useForm({
    defaultValues: {
      grade: '',
      min_score: '',
      max_score: '',
      remarks: '',
      points: ''
    }
  });

  const isActive = watch('is_active');

  const loadSystem = async () => {
    setLoading(true);
    const result = await FetchGradingSystemById(id);
    if (result.success) {
      const data = result.data;
      setSystem(data);
      setValue('name', data.name);
      setValue('description', data.description || '');
      setValue('is_active', data.is_active);
    } else {
      toast.error("Failed to load grading system");
      router.push('/grading');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSystem();
  }, [id]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    const result = await UpdateGradingSystem(id, data);

    if (result.success) {
      toast.success("Grading system updated successfully");
      loadSystem();
    } else {
      toast.error("Failed to update grading system");
    }
    setSaving(false);
  };

  const openBoundaryModal = (boundary?: GradeBoundary) => {
    if (boundary) {
      setEditingBoundary(boundary);
      resetBoundary({
        grade: boundary.grade,
        min_score: boundary.min_score.toString(),
        max_score: boundary.max_score.toString(),
        remarks: boundary.remarks || '',
        points: boundary.points?.toString() || ''
      });
    } else {
      setEditingBoundary(null);
      resetBoundary({
        grade: '',
        min_score: '',
        max_score: '',
        remarks: '',
        points: ''
      });
    }
    setBoundaryModalOpen(true);
  };

  const onBoundarySubmit = async (data: any) => {
    setBoundarySaving(true);
    const payload = {
      ...data,
      grading_system: id,
      points: data.points ? parseInt(data.points) : null
    };

    let result;
    if (editingBoundary) {
      result = await UpdateGradeBoundary(editingBoundary.id, payload);
    } else {
      result = await CreateGradeBoundary(payload);
    }

    if (result.success) {
      toast.success(`Boundary ${editingBoundary ? 'updated' : 'added'} successfully`);
      setBoundaryModalOpen(false);
      loadSystem();
    } else {
      toast.error(`Failed to ${editingBoundary ? 'update' : 'add'} boundary`);
    }
    setBoundarySaving(false);
  };

  const handleDeleteBoundary = async (boundaryId: number) => {
    if (confirm("Are you sure you want to delete this grade boundary?")) {
      const result = await DeleteGradeBoundary(boundaryId);
      if (result.success) {
        toast.success("Boundary deleted successfully");
        loadSystem();
      } else {
        toast.error("Failed to delete boundary");
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;
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
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Grading System</h1>
            <p className="text-gray-500 mt-1">Manage system details and grade boundaries.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8 border-none shadow-sm ring-1 ring-gray-100">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                    System Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., O Level Grades"
                    className={`h-12 rounded-xl border-gray-200 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
                    {...register('name', { required: 'System name is required' })}
                  />
                  {errors.name && <ErrorMessage message={errors.name.message as string} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    placeholder="e.g., Used for S.1 to S.4"
                    className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
                    {...register('description')}
                  />
                </div>
              </div>
            </Card>

            {/* Boundaries Table */}
            <Card className="border-none shadow-sm ring-1 ring-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-indigo-500" />
                  Grade Boundaries
                </h3>
                <Button
                  type="button"
                  size="sm"
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none shadow-none"
                  onClick={() => openBoundaryModal()}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Grade
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {system?.boundaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No grades defined yet. Add boundaries to complete this grading system.
                        </TableCell>
                      </TableRow>
                    ) : (
                      system?.boundaries.map((boundary) => (
                        <TableRow key={boundary.id}>
                          <TableCell className="font-bold text-gray-900">{boundary.grade}</TableCell>
                          <TableCell>{boundary.min_score} - {boundary.max_score}</TableCell>
                          <TableCell>{boundary.remarks || '--'}</TableCell>
                          <TableCell>{boundary.points ?? '--'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openBoundaryModal(boundary)}
                            >
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBoundary(boundary.id)}
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <ToggleLeft className="w-5 h-5 mr-2 text-indigo-500" />
                Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-gray-900">Active Status</Label>
                    <p className="text-xs text-gray-500">System is active</p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(val: boolean) => setValue('is_active', val)}
                  />
                </div>
              </div>
            </Card>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Boundary Modal */}
      <Dialog open={boundaryModalOpen} onOpenChange={setBoundaryModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBoundary ? 'Edit' : 'Add'} Grade Boundary</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitBoundary(onBoundarySubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Grade</Label>
              <Input
                className="col-span-3"
                placeholder="e.g. D1"
                {...registerBoundary('grade', { required: 'Required' })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Min Score</Label>
              <Input
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="0"
                {...registerBoundary('min_score', { required: 'Required' })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Score</Label>
              <Input
                type="number"
                step="0.01"
                className="col-span-3"
                placeholder="100"
                {...registerBoundary('max_score', { required: 'Required' })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Remarks</Label>
              <Input
                className="col-span-3"
                placeholder="e.g. Distinction"
                {...registerBoundary('remarks')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Points</Label>
              <Input
                type="number"
                className="col-span-3"
                placeholder="e.g. 1"
                {...registerBoundary('points')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBoundaryModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={boundarySaving}>
                {boundarySaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
