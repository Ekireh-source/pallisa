"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VerifyEmail, ResendOTP } from "@/features/auth/auth.service";
import { useAppDispatch } from "@/store";
import {
  setAccessToken,
  setRefreshToken,
  setCurrentUser,
  setTemporaryPermissions,
  setSchool,
  userActivityDetected,
} from "@/store/auth/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { MailCheck, ArrowLeft, RefreshCw, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    // Focus the next empty or last input
    const nextEmpty = newOtp.findIndex((v) => !v);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleVerify = useCallback(async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await VerifyEmail({ data: { email, otp: otpString } });

      if (result.success) {
        setIsVerified(true);
        toast.success("Email verified successfully!");

        // Auto-login: set tokens and user data from the response
        const { access, refresh, user_profile, school } = result.data;
        if (access) dispatch(setAccessToken(access));
        if (refresh) dispatch(setRefreshToken(refresh));
        if (user_profile) {
          dispatch(setCurrentUser(user_profile));
          if (user_profile.user_permissions) {
            dispatch(setTemporaryPermissions(user_profile.user_permissions as any));
          }
        }
        if (school) dispatch(setSchool(school));
        dispatch(userActivityDetected());

        // Redirect after a short delay
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      } else {
        const errorMsg =
          result.error?.error ||
          result.error?.message ||
          "Verification failed. Please try again.";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.error(err?.error || err?.message || "An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, dispatch, router]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !isVerifying && !isVerified) {
      handleVerify();
    }
  }, [otp, isVerifying, isVerified, handleVerify]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setIsResending(true);
    try {
      const result = await ResendOTP(email);
      if (result.success) {
        toast.success("A new verification code has been sent to your email.");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error("Failed to resend verification code.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Success state
  if (isVerified) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="text-muted-foreground text-base mt-2">
              Your email has been successfully verified. Redirecting you to the dashboard...
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <MailCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
        <p className="text-muted-foreground text-base">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-gray-900">{email || "your email"}</span>.
          Enter the code below to verify your account.
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`
                w-12 h-14 text-center text-xl font-semibold rounded-xl border-2
                outline-none transition-all duration-200
                ${digit
                  ? "border-primary bg-primary/5 text-gray-900"
                  : "border-gray-200 bg-white text-gray-500"
                }
                focus:border-primary focus:ring-2 focus:ring-primary/20
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              disabled={isVerifying}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={otp.join("").length !== 6 || isVerifying}
          className="w-full h-12 rounded-full"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            "Verify Email"
          )}
        </Button>

        {/* Resend Code */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending || !email}
            className={`
              inline-flex items-center gap-2 text-sm font-medium transition-colors
              ${resendCooldown > 0 || isResending
                ? "text-gray-400 cursor-not-allowed"
                : "text-primary hover:text-primary/80 cursor-pointer"
              }
            `}
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
            {isResending
              ? "Sending..."
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Code"
            }
          </button>
        </div>

        {/* Back to Login */}
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
