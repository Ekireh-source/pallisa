'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  Label,
  ErrorMessage
} from '@/components/ui';
import { ForgotPasswordSchema, IForgotPasswordInput } from '@/features/auth/auth.schemas';
import { RequestPasswordReset } from '@/features/auth/auth.service';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: IForgotPasswordInput) => {
    setLoading(true);
    const result = await RequestPasswordReset({ data });

    if (result.success) {
      setSubmitted(true);
      toast.success("Reset link sent to your email");
    } else {
      toast.error("Failed to send reset link. Please try again.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md p-8 border-none -2xl -indigo-100 rounded-[32px] text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-My-Black">Check your email</h1>
          <p className="text-gray-500 leading-relaxed">
            We've sent a password reset link to your email address. Please follow the instructions to reset your password.
          </p>
          <div className="pt-6">
            <Link href="/login">
              <Button className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">
                Return to Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md p-8 border-none -2xl -indigo-100 rounded-[32px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold text-My-Black tracking-tight">Forgot Password</h1>
          <p className="text-gray-500 font-medium">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-My-Black ml-1">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-My-Black group-focus-within:text-indigo-500 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="name@school.com"
                className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                {...register('email')}
              />
            </div>
            {errors.email && <ErrorMessage message={errors.email.message} />}
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl -xl -indigo-200 font-extrabold text-lg transition-all hover:scale-[1.02] active:scale-95 bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
