"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/store"
import { registerUser, clearError, clearFieldError } from "@/store/slices/authSlice"
import type { RegisterData, SchoolRegistrationData } from "@/types"
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
  Home,
  AlertCircle,
  Zap,
  Shield,
  BookOpen
} from "lucide-react"

const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { loading, error, fieldErrors } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showMobileBackground, setShowMobileBackground] = useState(false)
  const [scrollY, setScrollY] = useState(0)

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

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    
    if (!formData.email) errors.email = 'Email is required'
    else if (!formData.email.includes('@')) errors.email = 'Please enter a valid email'
    
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
    
    if (!formData.first_name) errors.first_name = 'First name is required'
    if (!formData.last_name) errors.last_name = 'Last name is required'
    if (!formData.phone) errors.phone = 'Phone number is required'
    
    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!schoolData.school_name) errors.school_name = 'School name is required'
    if (!schoolData.school_address) errors.school_address = 'School address is required'
    if (!schoolData.school_phone) errors.school_phone = 'School phone is required'
    if (!schoolData.school_email) errors.school_email = 'School email is required'
    if (!schoolData.campus_name) errors.campus_name = 'Campus name is required'
    
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
      if (validateStep1()) {
        setCurrentStep(2)
      }
      return
    }
    
    if (!validateStep2()) return
    if (!agreeToTerms) {
      setLocalErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }))
      return
    }
    
    const registrationData = {
      ...formData,
      school_data: schoolData
    }
    
    const result = await dispatch(registerUser(registrationData))
    
    // Check if registration was successful
    if (registerUser.fulfilled.match(result)) {
      // Registration successful - redirect to email verification page
      const searchParams = new URLSearchParams({
        email: formData.email,
        message: 'Registration successful! Please check your email for the verification code.'
      })
      router.push(`/verify-email?${searchParams.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PALLISA
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-400 transition-colors flex items-center group">
                <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Home
              </Link>
              <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Sign In
              </Link>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setShowMobileBackground(!showMobileBackground)}>
              {showMobileBackground ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {showMobileBackground && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 space-y-4">
              <Link href="/" className="block text-gray-600 hover:text-blue-400 transition-colors">Home</Link>
              <Link href="/login" className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-center">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Pallisa High School</h1>
            <p className="text-gray-600 text-lg">Create your school management account</p>
          </div>

          {/* Registration Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border-0 shadow-2xl backdrop-blur-sm">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div className={`w-16 h-1 rounded-full ${
                  currentStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'
                }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
                </div>
              </div>
            </div>

            {/* Display general error */}
            {(error || Object.keys(fieldErrors).length > 0) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-red-600 text-sm font-medium">{error || 'Please fix the errors below'}</p>
                </div>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      First Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                          getFieldError('first_name') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                        }`}
                      />
                    </div>
                    {getFieldError('first_name') && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('first_name')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Last Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                          getFieldError('last_name') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                        }`}
                      />
                    </div>
                    {getFieldError('last_name') && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('last_name')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('email') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('email')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('phone') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('phone') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('phone')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('password') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('password')}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center">
                    Next Step
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: School Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">School Information</h2>
                  <p className="text-gray-600">Tell us about your school</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      School Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="school_name"
                        value={schoolData.school_name}
                        onChange={handleSchoolDataChange}
                        placeholder="Enter school name"
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                          getFieldError('school_name') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                        }`}
                      />
                    </div>
                    {getFieldError('school_name') && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('school_name')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      School Phone
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        name="school_phone"
                        value={schoolData.school_phone}
                        onChange={handleSchoolDataChange}
                        placeholder="Enter school phone"
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                          getFieldError('school_phone') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                        }`}
                      />
                    </div>
                    {getFieldError('school_phone') && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('school_phone')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    School Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="school_email"
                      value={schoolData.school_email}
                      onChange={handleSchoolDataChange}
                      placeholder="Enter school email"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('school_email') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('school_email') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('school_email')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    School Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="school_address"
                      value={schoolData.school_address}
                      onChange={handleSchoolDataChange}
                      placeholder="Enter school address"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('school_address') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('school_address') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('school_address')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    School Website (Optional)
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      name="school_website"
                      value={schoolData.school_website}
                      onChange={handleSchoolDataChange}
                      placeholder="Enter school website"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white hover:border-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Campus Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="campus_name"
                      value={schoolData.campus_name}
                      onChange={handleSchoolDataChange}
                      placeholder="Enter campus name"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white ${
                        getFieldError('campus_name') ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    />
                  </div>
                  {getFieldError('campus_name') && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('campus_name')}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <p className="text-sm text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                        Privacy Policy
                      </Link>
                    </p>
                    {getFieldError('terms') && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('terms')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Previous
                    </div>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Create Account
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600">Fast Setup</p>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600">Collaborative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
