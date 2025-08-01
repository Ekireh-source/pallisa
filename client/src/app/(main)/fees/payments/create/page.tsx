"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Search, 
  User, 
  Plus, 
  DollarSign, 
  Calendar, 
  Users, 
  CreditCard,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';
import { apiGet, apiPost, API_ENDPOINTS } from "@/lib/api";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

interface Option { 
  id: number; 
  name: string; 
}

interface Student {
  id: number;
  name: string;
  full_name?: string;
  student_id?: string;
  class_name?: string;
}

export default function CreateFeePaymentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    student: "",
    category: "",
    academic_year: "",
    term: "",
    amount_paid: "",
    payment_method: "cash",
    payment_status: "completed",
    payment_date: "",
    due_date: "",
    scholarship: "",
    discount_amount: "",
    notes: "",
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [categories, setCategories] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [scholarships, setScholarships] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [studentsData, categoriesData, yearsData, termsData, scholarshipsData] = await Promise.all([
          apiGet<{ results: Option[] }>(API_ENDPOINTS.MEMBERS_STUDENTS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.FEES + 'categories/'),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.ACADEMIC_YEARS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.TERMS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.FEES + 'scholarships/'),
        ]);
        
        setStudents(studentsData.results || studentsData);
        setCategories(categoriesData.results || categoriesData);
        setYears(yearsData.results || yearsData);
        setTerms(termsData.results || termsData);
        setScholarships(scholarshipsData.results || scholarshipsData);
      } catch (error) {
        setError("Failed to load form options");
        console.error('Error loading options:', error);
      } finally {
        setOptionsLoading(false);
      }
    };
    
    loadOptions();
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (studentSearchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        (student.full_name || student.name).toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        (student.student_id && student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase()))
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearchTerm, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    const errors: { [key: string]: string } = {};
    if (!formData.student) errors.student = 'Student is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.academic_year) errors.academic_year = 'Academic year is required';
    if (!formData.term) errors.term = 'Term is required';
    if (!formData.amount_paid) errors.amount_paid = 'Amount paid is required';
    if (!formData.payment_date) errors.payment_date = 'Payment date is required';
    if (!formData.due_date) errors.due_date = 'Due date is required';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      const paymentData = {
        student: parseInt(formData.student),
        category: parseInt(formData.category),
        academic_year: parseInt(formData.academic_year),
        term: parseInt(formData.term),
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        payment_date: formData.payment_date,
        due_date: formData.due_date,
        scholarship: formData.scholarship ? parseInt(formData.scholarship) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : 0.00,
        notes: formData.notes,
      };
      
      console.log('Sending payment data:', paymentData);
      
      await apiPost(API_ENDPOINTS.FEES + 'payments/', paymentData);
      router.push("/fees/payments");
    } catch (err) {
      console.error('Error creating payment:', err);
      
      // Handle axios error response
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
        const errorData = (err.response as any).data;
        console.log('Backend validation errors:', errorData);
        
        // If it's a validation error with field-specific errors
        if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          setFieldErrors(errorData);
          setError("Please fix the validation errors below");
        } else {
          setError(errorData.message || errorData.detail || "Failed to create payment");
        }
      } else {
        setError("Failed to create payment");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStudentSelect = (student: Student) => {
    setFormData(prev => ({ ...prev, student: student.id.toString() }));
    setStudentSearchTerm(student.full_name || student.name);
    setShowStudentDropdown(false);
    if (fieldErrors.student) {
      setFieldErrors(prev => ({ ...prev, student: '' }));
    }
  };

  const getSelectedStudentName = () => {
    if (!formData.student) return "";
    const student = students.find(s => s.id.toString() === formData.student);
    return student ? (student.full_name || student.name) : "";
  };

  if (optionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Create Fee Payment
                  </h1>
                  <p className="text-purple-100 text-sm sm:text-base mt-1">
                    Record a new payment for a student
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3 text-sm text-purple-100">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{students.length} Students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{categories.length} Categories</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href="/fees/payments"
                  className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Payments
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Search */}
              <div>
                <Label htmlFor="student" className="text-sm font-medium text-gray-700">
                  Student *
                </Label>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    id="student"
                    className={`pl-10 h-11 ${fieldErrors.student ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Search for student by name or ID..."
                    value={studentSearchTerm}
                    onChange={(e) => {
                      setStudentSearchTerm(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    required
                  />
                  {formData.student && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-green-600 text-sm font-medium">
                        ✓ {getSelectedStudentName()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Student Dropdown */}
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.full_name || student.name}
                            </div>
                            {student.student_id && (
                              <div className="text-sm text-gray-500">
                                ID: {student.student_id}
                              </div>
                            )}
                            {student.class_name && (
                              <div className="text-sm text-gray-500">
                                Class: {student.class_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {fieldErrors.student && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldErrors.student}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Fee Category *
                  </Label>
                  <select
                    id="category"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.category}
                    </p>
                  )}
                </div>

                {/* Academic Year */}
                <div>
                  <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">
                    Academic Year *
                  </Label>
                  <select
                    id="academic_year"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.academic_year}
                    onChange={(e) => handleInputChange('academic_year', e.target.value)}
                    required
                  >
                    <option value="">Select an academic year...</option>
                    {years.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.academic_year && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.academic_year}
                    </p>
                  )}
                </div>

                {/* Term */}
                <div>
                  <Label htmlFor="term" className="text-sm font-medium text-gray-700">
                    Term *
                  </Label>
                  <select
                    id="term"
                    className={`mt-2 w-full h-11 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      fieldErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.term}
                    onChange={(e) => handleInputChange('term', e.target.value)}
                    required
                  >
                    <option value="">Select a term...</option>
                    {terms.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {fieldErrors.term && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.term}
                    </p>
                  )}
                </div>

                {/* Amount Paid */}
                <div>
                  <Label htmlFor="amount_paid" className="text-sm font-medium text-gray-700">
                    Amount Paid *
                  </Label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">UGX</span>
                    </div>
                    <Input
                      type="number"
                      id="amount_paid"
                      className={`pl-12 h-11 ${fieldErrors.amount_paid ? 'border-red-300 bg-red-50' : ''}`}
                      value={formData.amount_paid}
                      onChange={(e) => handleInputChange('amount_paid', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  {fieldErrors.amount_paid && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.amount_paid}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <Label htmlFor="payment_method" className="text-sm font-medium text-gray-700">
                    Payment Method *
                  </Label>
                  <select
                    id="payment_method"
                    className="mt-2 w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <Label htmlFor="payment_status" className="text-sm font-medium text-gray-700">
                    Payment Status *
                  </Label>
                  <select
                    id="payment_status"
                    className="mt-2 w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.payment_status}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <Label htmlFor="payment_date" className="text-sm font-medium text-gray-700">
                    Payment Date *
                  </Label>
                  <Input
                    type="date"
                    id="payment_date"
                    className={`mt-2 h-11 ${fieldErrors.payment_date ? 'border-red-300 bg-red-50' : ''}`}
                    value={formData.payment_date}
                    onChange={(e) => handleInputChange('payment_date', e.target.value)}
                    required
                  />
                  {fieldErrors.payment_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.payment_date}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">
                    Due Date *
                  </Label>
                  <Input
                    type="date"
                    id="due_date"
                    className={`mt-2 h-11 ${fieldErrors.due_date ? 'border-red-300 bg-red-50' : ''}`}
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    required
                  />
                  {fieldErrors.due_date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.due_date}
                    </p>
                  )}
                </div>

                {/* Scholarship */}
                <div>
                  <Label htmlFor="scholarship" className="text-sm font-medium text-gray-700">
                    Scholarship
                  </Label>
                  <select
                    id="scholarship"
                    className="mt-2 w-full h-11 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={formData.scholarship}
                    onChange={(e) => handleInputChange('scholarship', e.target.value)}
                  >
                    <option value="">None</option>
                    {scholarships.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                {/* Discount Amount */}
                <div>
                  <Label htmlFor="discount_amount" className="text-sm font-medium text-gray-700">
                    Discount Amount
                  </Label>
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">UGX</span>
                    </div>
                    <Input
                      type="number"
                      id="discount_amount"
                      className="pl-12 h-11"
                      value={formData.discount_amount}
                      onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  className="mt-2 resize-none"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional notes about this payment..."
                />
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                  <Link
                    href="/fees/payments"
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    Cancel
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>Tips for recording payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Student search</h4>
                  <p className="text-sm text-gray-600">Search for students by name or student ID</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Verify details</h4>
                  <p className="text-sm text-gray-600">Ensure the student and category are correct</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Record accurately</h4>
                  <p className="text-sm text-gray-600">Record the actual amount paid and payment method</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Add notes</h4>
                  <p className="text-sm text-gray-600">Use notes for special circumstances</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 