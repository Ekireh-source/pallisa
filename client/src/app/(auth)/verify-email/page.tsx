'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import { verifyEmail, resendVerification, clearError, clearFieldError } from '@/store/slices/authSlice';
import { Input, Button, ErrorMessage, SuccessMessage, Label } from '@/components/ui';
import { 
  Mail, ArrowRight, RefreshCw, CheckCircle, Shield, Lock, 
  X, Zap, Clock, Check 
} from 'lucide-react';

const VerifyEmailContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error, fieldErrors, isAuthenticated } = useAppSelector((state) => state.auth);

  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showMobileBackground, setShowMobileBackground] = useState(false);

  // Get email from URL params
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect to dashboard if already authenticated  
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setOtp(value);
    
    // Clear field errors when user starts typing
    if (fieldErrors.otp) {
      dispatch(clearFieldError('otp'));
    }
    if (localErrors.otp) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.otp;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!otp) errors.otp = 'Verification code is required';
    else if (otp.length !== 6) errors.otp = 'Verification code must be 6 digits';
    
    if (!email) errors.email = 'Email is required';

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName] || localErrors[fieldName];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(verifyEmail({ email, otp }));
      
      if (verifyEmail.fulfilled.match(result)) {
        // Verification successful - redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setResendError('Email is required to resend verification code');
      return;
    }

    if (countdown > 0) {
      return;
    }

    setResendLoading(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const result = await dispatch(resendVerification(email));
      
      if (resendVerification.fulfilled.match(result)) {
        setResendSuccess(true);
        setResendError('');
        setCountdown(60); // 60 second countdown
        // Clear success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      setResendError('Failed to resend verification code');
      console.error('Resend verification failed:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Background Toggle Button */}
      <button
        onClick={() => setShowMobileBackground(!showMobileBackground)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg border"
      >
        {showMobileBackground ? <X className="w-5 h-5" /> : <Mail className="w-5 h-5 text-blue-600" />}
      </button>

      {/* Mobile Background Overlay */}
      {showMobileBackground && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center text-white">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-3">Email Verification</h2>
              <p className="text-sm opacity-90 mb-6 max-w-sm">
                Secure your account with our advanced email verification system.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure Process</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Quick Setup</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Protected Account</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white min-h-screen lg:min-h-auto">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Verify your email
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-2">
                We&apos;ve sent a 6-digit verification code to
              </p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                {email}
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <ErrorMessage 
                message={error || undefined} 
                errors={Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined}
              />
            )}

            {/* Success message for resend */}
            {resendSuccess && (
              <div className="flex items-center p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <SuccessMessage message="Verification code sent successfully!" />
              </div>
            )}

            {/* Resend error */}
            {resendError && (
              <ErrorMessage message={resendError} />
            )}

            {/* OTP Input */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="otp" className="text-sm text-center block">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  aria-invalid={!!getFieldError('otp')}
                  placeholder="000000"
                  className="text-center text-xl sm:text-2xl tracking-[0.5em] font-mono h-12 sm:h-16 rounded-xl"
                  maxLength={6}
                />
              </div>
              
              {/* Code format helper */}
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
              className="bg-green-700 hover:bg-green-800 text-white h-11 sm:h-12 font-medium flex items-center justify-center rounded-xl"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>

            {/* Resend Section */}
            <div className="text-center space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Didn&apos;t receive the code?
              </p>
              
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || countdown > 0}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  resendLoading || countdown > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>

            {/* Navigation Links */}
            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 text-center">
                <Link
                  href="/login"
                  className="flex-1 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors py-2"
                >
                  Back to login
                </Link>
                <Link
                  href="/register"
                  className="flex-1 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors py-2"
                >
                  Create new account
                </Link>
              </div>
            </div>
          </form>

          {/* Help Section */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              If you&apos;re having trouble receiving the verification email, check your spam folder or contact support.
            </p>
            <Link
              href="/"
              className="text-xs text-blue-600 hover:text-blue-500 transition-colors font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Background (Desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="mb-6">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-90" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Email Verification</h2>
            <p className="text-lg opacity-90 max-w-md mb-8">
              Secure your account with our advanced email verification system. Quick, easy, and completely secure.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure Process</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Quick Setup</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Protected Account</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Real-time Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage; 