'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage
} from '@/components/ui';
import { PasswordResetSchema, IPasswordReset } from '@/features/auth/auth.schemas';
import { PasswordReset } from '@/features/auth/auth.service';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IPasswordReset>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      token: token || '',
    }
  });

  const onSubmit = async (data: IPasswordReset) => {
    if (!token) {
      toast.error("Invalid reset token. Please request a new one.");
      return;
    }

    setLoading(true);
    const response = await PasswordReset({ data });

    if (response.success) {
      setSubmitted(true);
      toast.success("Password reset successfully");
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      toast.error(response.error?.message || "Failed to reset password. Token might be expired.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md p-8 border-none -2xl -red-100 rounded-[32px] text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-My-Black">Invalid Link</h1>
        <p className="text-gray-500 leading-relaxed">
          The password reset link is invalid or missing. Please request a new link.
        </p>
        <div className="pt-6">
          <Link href="/forgot-password">
            <Button className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
              Request New Link
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md p-8 border-none -2xl -indigo-100 rounded-[32px] text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-My-Black">Password Reset!</h1>
        <p className="text-gray-500 leading-relaxed">
          Your password has been successfully updated. You will be redirected to the login page shortly.
        </p>
        <div className="pt-6">
          <Link href="/login">
            <Button className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
              Go to Login Now
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 border-none -2xl -indigo-100 rounded-[32px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-My-Black tracking-tight">Set New Password</h1>
        <p className="text-gray-500 font-medium">Please enter your new secure password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('token')} />

        <div className="space-y-2">
          <Label htmlFor="new_password" className="text-sm font-bold text-My-Black ml-1">New Password</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-My-Black group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="new_password"
              type="password"
              placeholder="••••••••"
              className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
              {...register('new_password')}
            />
          </div>
          {errors.new_password && <ErrorMessage message={errors.new_password.message} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-sm font-bold text-My-Black ml-1">Confirm New Password</Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-My-Black group-focus-within:text-indigo-500 transition-colors" />
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
              {...register('confirm_password')}
            />
          </div>
          {errors.confirm_password && <ErrorMessage message={errors.confirm_password.message} />}
        </div>

        <Button
          type="submit"
          className="w-full h-14 rounded-2xl -xl -indigo-200 font-extrabold text-lg transition-all hover:scale-[1.02] active:scale-95 bg-indigo-600 hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-indigo-500" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
