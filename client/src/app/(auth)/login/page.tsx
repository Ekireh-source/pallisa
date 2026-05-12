"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, ILoginInput } from "@/features/auth/auth.schemas";
import { loginStart, clearAuthError } from "@/store/auth/actions";
import { selectUserLoading, selectAuthError, selectUser } from "@/store/auth/selectors";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import PasswordInput from "@/components/password-input";
import { Button, Input, Label } from "@/components/ui";
import Link from "next/link";

import { AlertCircle } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const isLoggingIn = useAppSelector(selectUserLoading);
  const currentUser = useAppSelector(selectUser);
  const authError = useAppSelector(selectAuthError);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (authError?.message) {
      toast.error(authError.message);
    }
  }, [authError]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ILoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const handleLogin = (data: ILoginInput) => {
    dispatch(loginStart(data));
  };

  const loading = navigating || isLoggingIn;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-2xl font-bold text-gray-900">Log Into your account</h2>
          <p className="text-muted-foreground text-base">
            Enter your email and Password to access your Account
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{authError.message}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(handleLogin)}>
          <div className="space-y-2">
            <Label htmlFor="identifier">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="identifier"
                  type="text"
                  placeholder="youremail@semail.com"
                  className={`h-12 rounded-2xl ${errors.email ? "border-red-500" : ""}`}
                />
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <PasswordInput
                    {...field}
                    id="password"
                    label="Password"
                    placeholder="Type a password"
                    showValidation={false}
                    required
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full"
            
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <p className="text-sm text-center opacity-70 mt-8">
            New Here?{" "}
            <Link
              href="/register"
              onClick={() => setNavigating(true)}
              className="text-primary underline hover:underline-offset-2"
            >
              Create Account
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
