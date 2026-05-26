'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, User, Briefcase, Mail, Calendar, Award } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  ErrorMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DialogFooter,
} from '@/components/ui';
import { FetchRoles } from '@/features/auth/auth.service';
import { FetchCampuses } from '@/features/school/school.service';
import { TeacherSchema, ITeacherInput } from '@/features/members/members.schemas';
import { CreateTeacher } from '@/features/members/members.service';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface AddTeacherModalProps {
  onTeacherAdded: (newTeacher: any) => void;
  trigger?: React.ReactNode;
}

export function AddTeacherModal({ onTeacherAdded, trigger }: AddTeacherModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ITeacherInput>({
    resolver: zodResolver(TeacherSchema),
    defaultValues: {
      user_first_name: '',
      user_last_name: '',
      user_email: '',
      user_gender: 'M',
      employee_id: '',
      employment_type: 'full_time',
      is_active: true,
      user_role_id: undefined,
      campus: undefined as any,
    }
  });

  const selectedRole = watch('user_role_id');
  const selectedGender = watch('user_gender');
  const selectedEmployment = watch('employment_type');
  const selectedCampus = watch('campus');
  const isActive = watch('is_active');

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoadingRoles(true);
        setLoadingCampuses(true);
        const [rolesRes, campusesRes] = await Promise.all([
          FetchRoles(),
          FetchCampuses()
        ]);
        if (rolesRes.success) {
          setRoles(rolesRes.data.results);
        }
        if (campusesRes && 'results' in campusesRes) {
          setCampuses(campusesRes.results);
        }
        setLoadingRoles(false);
        setLoadingCampuses(false);
      };
      loadData();
    }
  }, [open]);

  const onSubmit = async (values: any) => {
    const data = values as ITeacherInput;
    setLoading(true);
    
    try {
      // Create FormData to handle the API expectations
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });

      const result = await CreateTeacher(formData);
      
      if (result.success) {
        toast.success("Teacher registered successfully");
        onTeacherAdded(result.data);
        reset();
        setOpen(false);
      } else {
        toast.error("Failed to register teacher");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errs: any) => {
    console.error("Form validation errors:", errs);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-12 px-4 rounded-xl border-dashed border-gray-300 hover:border-primary hover:text-primary transition-all flex items-center gap-1.5 font-semibold text-gray-600 bg-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </Button>
      )}

      <DialogContent className="max-w-3xl rounded-2xl p-6 md:p-8 bg-white border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Add New Teacher
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1">
            Register a new teacher to assign to streams and classes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 mt-4">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                <User className="w-4 h-4 text-primary" />
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal_user_first_name">First Name</Label>
                  <Input
                    id="modal_user_first_name"
                    placeholder="Enter first name"
                    className="h-11 rounded-xl border-gray-200"
                    {...register('user_first_name')}
                  />
                  {errors.user_first_name && <ErrorMessage message={errors.user_first_name.message} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_user_last_name">Last Name</Label>
                  <Input
                    id="modal_user_last_name"
                    placeholder="Enter last name"
                    className="h-11 rounded-xl border-gray-200"
                    {...register('user_last_name')}
                  />
                  {errors.user_last_name && <ErrorMessage message={errors.user_last_name.message} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_user_email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="modal_user_email"
                      type="email"
                      placeholder="teacher@school.edu"
                      className="h-11 pl-10 rounded-xl border-gray-200"
                      {...register('user_email')}
                    />
                  </div>
                  {errors.user_email && <ErrorMessage message={errors.user_email.message} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_user_gender">Gender</Label>
                  <Select
                    onValueChange={(val) => setValue('user_gender', val as any)}
                    value={selectedGender}
                  >
                    <SelectTrigger id="modal_user_gender" className="h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="modal_user_role_id">System Role</Label>
                  <Select
                    onValueChange={(val) => setValue('user_role_id', parseInt(val))}
                    value={selectedRole?.toString()}
                  >
                    <SelectTrigger id="modal_user_role_id" className={`h-11 rounded-xl border-gray-200 focus:ring-primary ${errors.user_role_id ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {loadingRoles ? (
                        <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                      ) : roles.length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">No roles found</div>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.user_role_id && <ErrorMessage message={errors.user_role_id.message} />}
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="modal_campus">Campus</Label>
                  <Select
                    onValueChange={(val) => setValue('campus', parseInt(val))}
                    value={selectedCampus?.toString()}
                  >
                    <SelectTrigger id="modal_campus" className={`h-11 rounded-xl border-gray-200 focus:ring-primary ${errors.campus ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      {loadingCampuses ? (
                        <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
                      ) : campuses.length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">No campuses found</div>
                      ) : (
                        campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id.toString()}>
                            {campus.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.campus && <ErrorMessage message={errors.campus.message} />}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Professional Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal_employee_id">Employee ID (Optional, auto-generated)</Label>
                  <Input
                    id="modal_employee_id"
                    placeholder="e.g., TCH-2024-001"
                    className="h-11 rounded-xl border-gray-200"
                    {...register('employee_id')}
                  />
                  {errors.employee_id && <ErrorMessage message={errors.employee_id.message} />}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_employment_type">Employment Type</Label>
                  <Select
                    onValueChange={(val) => setValue('employment_type', val as any)}
                    value={selectedEmployment}
                  >
                    <SelectTrigger id="modal_employment_type" className="h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100">
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="substitute">Substitute</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_specialization">Specialization / Subjects</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="modal_specialization"
                      placeholder="e.g., Mathematics, Physics"
                      className="h-11 pl-10 rounded-xl border-gray-200"
                      {...register('specialization')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_qualification">Qualification</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="modal_qualification"
                      placeholder="e.g., B.Ed, M.Sc"
                      className="h-11 pl-10 rounded-xl border-gray-200"
                      {...register('qualification')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_hire_date">Hire Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="modal_hire_date"
                      type="date"
                      className="h-11 pl-10 rounded-xl border-gray-200"
                      {...register('hire_date')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100 shadow-sm self-end h-11">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-gray-900">Active Status</Label>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(val) => setValue('is_active', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2 mt-8 pt-4 border-t border-gray-50">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl text-gray-500 hover:bg-gray-50 px-6 font-semibold"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl px-8 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Add Teacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
