"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema, ICreateUserInput } from "@/features/auth/auth.schemas";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuthError } from "@/store/auth/actions";
import { selectUser } from "@/store/auth/selectors";
import {
  Button,
  Input,
  Label,
  ErrorMessage,
  SuccessMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui";
import PasswordInput from "@/components/password-input";
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  MapPin,
  Globe,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CheckCircle,
  Calendar,
  Contact,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { UserSignup } from "@/features/auth/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectUser);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isValid },
  } = useForm<ICreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      other_name: "",
      phone: "",
      gender: undefined,
      dob: "",
      emergency_contact: "",
      emergency_phone: "",
      emergency_contact_address: "",
      emergency_contact_email: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ["first_name", "last_name", "email", "phone", "gender", "dob"];
    }

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const onFormSubmit = async (data: ICreateUserInput) => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const result = await UserSignup({ data });
      if (result.success) {
        toast.success("Registration successful! Please verify your email.");
        router.push(`/verify-email?email=${data.email}`);
      } else {
        let errorMsg = "Signup failed";
        if (typeof result.error === 'string') {
          errorMsg = result.error;
        } else if (typeof result.error === 'object' && result.error !== null) {
          // Flatten field-specific errors
          errorMsg = Object.entries(result.error)
            .map(([field, msgs]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              const message = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${fieldName}: ${message}`;
            })
            .join(' | ');
        }
        setLocalError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      setLocalError(error.message || "An unexpected error occurred");
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for successful signup in the state (if we had a success flag)
  // For now, we can check if loading stopped and error is null after submission
  // But usually sagas handle side effects like redirection.

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="flex flex-col items-start gap-2">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-My-Black">Create your account</h2>
        <p className="text-muted-foreground text-base">
          Join PALLISA to manage your school efficiently.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-gray-200"
              }`}
          />
        ))}
      </div>

      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm mb-6 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{localError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="first_name" placeholder="John" />
                  )}
                />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="last_name" placeholder="Doe" />
                  )}
                />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="email" type="email" placeholder="john.doe@example.com" />
                )}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="phone" type="tel" placeholder="+256..." />
                )}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Controller
                  name="dob"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="dob" type="date" />
                  )}
                />
                {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
              </div>
            </div>

            <Button type="button" onClick={handleNext} className="w-full h-12 rounded-full mt-4">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-semibold text-gray-800">Security</h3>
            <div className="space-y-2">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    id="password"
                    label="Password"
                    placeholder="Create a strong password"
                    showValidation={true}
                  />
                )}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Controller
                name="confirm_password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    id="confirm_password"
                    label="Confirm Password"
                    placeholder="Repeat your password"
                    showValidation={false}
                  />
                )}
              />
              {errors.confirm_password && <p className="text-xs text-red-500">{errors.confirm_password.message}</p>}
            </div>

            <div className="flex gap-4 mt-4">
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-12 rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing up...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </div>
        )}

        <p className="text-sm text-center opacity-70 mt-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline hover:underline-offset-2"
          >
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
