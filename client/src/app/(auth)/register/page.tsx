"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/store"
import { registerUser, clearError, clearFieldError } from "@/store/slices/authSlice"
import type { RegisterData, SchoolRegistrationData } from "@/types"
import { Input, Button, ErrorMessage, Label, Checkbox } from "@/components/ui"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Check,
  MapPin,
  Globe,
  Users,
  GraduationCap,
  X,
  Menu,
} from "lucide-react"

const RegisterPage: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth)

  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showMobileBackground, setShowMobileBackground] = useState(false)

  // Form state
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  })

  // School data state (only for school owners)
  const [schoolData, setSchoolData] = useState<SchoolRegistrationData>({
    school_name: "",
    school_address: "",
    school_phone: "",
    school_email: "",
    school_website: "",
    campus_name: "",
    campus_address: "",
    campus_phone: "",
  })

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [showSchoolFields, setShowSchoolFields] = useState(true)

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  // Always show school fields since only school owners can register
  useEffect(() => {
    setShowSchoolFields(true)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name))
    }
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSchoolData((prev) => ({ ...prev, [name]: value }))

    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      dispatch(clearFieldError(name))
    }
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.first_name) errors.first_name = "First name is required"
    if (!formData.last_name) errors.last_name = "Last name is required"
    if (!formData.email) errors.email = "Email is required"
    else if (!formData.email.includes("@")) errors.email = "Please enter a valid email"
    if (!formData.password) errors.password = "Password is required"
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters"
    if (!agreeToTerms) errors.terms = "You must agree to the terms & policy"

    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {}
    // Always require school data since only school owners can register
    if (!schoolData.school_name) errors.school_name = "School name is required"
    if (!schoolData.campus_name) errors.campus_name = "Campus name is required"

    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName] || localErrors[fieldName]
  }

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep === 1) {
      handleNextStep()
      return
    }

    if (!validateStep2()) {
      return
    }

    const registrationData: RegisterData = {
      ...formData,
      school_data: showSchoolFields ? schoolData : undefined,
    }

    try {
      const result = await dispatch(registerUser(registrationData))
      if (registerUser.fulfilled.match(result)) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  const totalSteps = showSchoolFields ? 2 : 1

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Navbar */}
      <nav className="w-full fixed top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="hidden md:grid grid-cols-3 items-center">
            {/* Left: Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  PALLISA
                </span>
              </Link>
            </div>
            {/* Center: Nav Links */}
            <div className="flex justify-center items-center space-x-8">
              <Link href="/page#features" className="text-gray-600 hover:text-blue-400 transition-colors">Features</Link>
              <Link href="/page#about" className="text-gray-600 hover:text-blue-400 transition-colors">About</Link>
              <Link href="/page#contact" className="text-gray-600 hover:text-blue-400 transition-colors">Contact</Link>
            </div>
            {/* Right: Login and Get Started Button */}
            <div className="flex justify-end items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-blue-400 transition-colors">Login</Link>
              <Link href="/register" className="px-6 py-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started
              </Link>
            </div>
          </div>
          {/* Mobile: logo left, menu button right */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  PALLISA
                </span>
              </Link>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setShowMobileBackground(!showMobileBackground)}>
              {showMobileBackground ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {/* Mobile Navigation */}
          {showMobileBackground && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 space-y-4 z-50">
              <Link href="/page#features" className="block text-gray-600 hover:text-blue-400 transition-colors">Features</Link>
              <Link href="/page#about" className="block text-gray-600 hover:text-blue-400 transition-colors">About</Link>
              <Link href="/page#contact" className="block text-gray-600 hover:text-blue-400 transition-colors">Contact</Link>
              <Link href="/login" className="block w-full text-left text-gray-600 hover:text-blue-400 transition-colors">Login</Link>
              <Link href="/register" className="w-full px-6 py-3 bg-blue-400 text-white rounded-full text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
      {/* Mobile Background Toggle Button */}
      <button
        onClick={() => setShowMobileBackground(!showMobileBackground)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg border"
      >
        {showMobileBackground ? <X className="w-5 h-5" /> : <GraduationCap className="w-5 h-5 text-blue-600" />}
      </button>

      {/* Mobile Background Overlay */}
      {showMobileBackground && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center text-white">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-3">Welcome to Pallisa</h2>
              <p className="text-sm opacity-90 mb-6 max-w-sm">
                Streamline your educational institution&apos;s expense management with our comprehensive solution.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Expense Tracking</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Budget Planning</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Approval Workflows</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Analytics Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white min-h-screen lg:min-h-auto pt-24">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {currentStep === 1 ? "Get Started Now" : "School Information"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {currentStep === 1
                ? "Create your account to start managing expenses efficiently"
                : "Tell us about your educational institution"}
            </p>
          </div>

          {/* Progress indicator for multi-step */}
          {showSchoolFields && (
            <div className="flex items-center justify-between px-2">
              {Array.from({ length: totalSteps }, (_, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                        currentStep > index + 1
                          ? "bg-green-600 text-white"
                          : currentStep === index + 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {currentStep > index + 1 ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : index + 1}
                    </div>
                    <span
                      className={`ml-1 sm:ml-2 text-xs font-medium ${
                        currentStep >= index + 1 ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                      {index === 0 ? "Personal" : "School"}
                    </span>
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                        currentStep > index + 1 ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <ErrorMessage
                message={error || undefined}
                errors={Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined}
              />
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name" className="text-sm">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-sm">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="pl-10 h-11 sm:h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-11 sm:h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10 h-11 sm:h-12"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 leading-5">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      terms & policy
                    </Link>
                  </Label>
                </div>
                {getFieldError("terms") && <p className="text-xs sm:text-sm text-red-600">{getFieldError("terms")}</p>}
              </div>
            )}

            {/* Step 2: School Information (only for school owners) */}
            {currentStep === 2 && showSchoolFields && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-4">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-2" />
                </div>

                <div>
                  <Label htmlFor="school_name" className="text-sm">
                    School Name
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="school_name"
                      name="school_name"
                      type="text"
                      required
                      value={schoolData.school_name}
                      onChange={handleSchoolDataChange}
                      placeholder="Springfield Elementary School"
                      className="pl-10 h-11 sm:h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="school_address" className="text-sm">
                    School Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="school_address"
                      name="school_address"
                      type="text"
                      value={schoolData.school_address}
                      onChange={handleSchoolDataChange}
                      placeholder="123 Education St, Springfield, ST 12345"
                      className="pl-10 h-11 sm:h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="school_phone" className="text-sm">
                      School Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="school_phone"
                        name="school_phone"
                        type="tel"
                        value={schoolData.school_phone}
                        onChange={handleSchoolDataChange}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="school_email" className="text-sm">
                      School Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="school_email"
                        name="school_email"
                        type="email"
                        value={schoolData.school_email}
                        onChange={handleSchoolDataChange}
                        placeholder="contact@springfield.edu"
                        className="pl-10 h-11 sm:h-12"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="school_website" className="text-sm">
                    School Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="school_website"
                      name="school_website"
                      type="url"
                      value={schoolData.school_website}
                      onChange={handleSchoolDataChange}
                      placeholder="https://springfield.edu"
                      className="pl-10 h-11 sm:h-12"
                    />
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Campus Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="campus_name" className="text-sm">
                        Campus Name
                      </Label>
                      <Input
                        id="campus_name"
                        name="campus_name"
                        type="text"
                        required
                        value={schoolData.campus_name}
                        onChange={handleSchoolDataChange}
                        placeholder="Main Campus"
                        className="h-11 sm:h-12"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="campus_address" className="text-sm">
                          Campus Address
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="campus_address"
                            name="campus_address"
                            type="text"
                            value={schoolData.campus_address}
                            onChange={handleSchoolDataChange}
                            placeholder="123 Campus Dr"
                            className="pl-10 h-11 sm:h-12"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="campus_phone" className="text-sm">
                          Campus Phone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="campus_phone"
                            name="campus_phone"
                            type="tel"
                            value={schoolData.campus_phone}
                            onChange={handleSchoolDataChange}
                            placeholder="+1 (555) 987-6543"
                            className="pl-10 h-11 sm:h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {currentStep === 2 && showSchoolFields ? (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="w-full sm:flex-1 h-11 sm:h-12 flex items-center justify-center order-2 sm:order-1 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="w-full sm:flex-1 bg-blue-400 hover:bg-blue-500 text-white h-11 sm:h-12 font-medium flex items-center justify-center order-1 sm:order-2"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  fullWidth
                  className="bg-blue-400 hover:bg-blue-500 text-white h-11 sm:h-12 font-medium flex items-center justify-center"
                >
                  {showSchoolFields ? "Continue" : "Create Account"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </form>

         

         

          {/* Sign in link */}
          <div className="text-center">
            <span className="text-xs sm:text-sm text-gray-600">
              Have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Background (Desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-gray-50 border-l border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-blue-400 p-8">
            <div className="mb-6">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-90" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome to Pallisa</h2>
            <p className="text-lg opacity-90 max-w-md text-blue-400">
              Streamline your educational institution&apos;s expense management with our comprehensive solution.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Expense Tracking</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Budget Planning</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Approval Workflows</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Analytics Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
