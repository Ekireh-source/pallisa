"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Search, User } from 'lucide-react';
import { apiGet, apiPost, API_ENDPOINTS } from "@/lib/api";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
      await apiPost(API_ENDPOINTS.FEES + 'payments/', {
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
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        notes: formData.notes,
      });
      router.push("/fees/payments");
    } catch (err) {
      setError("Failed to create payment");
      console.error('Error creating payment:', err);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/fees/payments"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Fee Payment</h1>
              <p className="mt-2 text-gray-600">
                Record a new payment for a student
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Student Search */}
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="student"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.student ? 'border-red-300' : 'border-gray-300'}`}
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
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
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
                <p className="mt-1 text-sm text-red-600">{fieldErrors.student}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Category *
                </label>
                <select
                  id="category"
                  className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.category ? 'border-red-300' : 'border-gray-300'}`}
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
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
                )}
              </div>

              {/* Academic Year */}
              <div>
                <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <select
                  id="academic_year"
                  className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.academic_year ? 'border-red-300' : 'border-gray-300'}`}
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
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.academic_year}</p>
                )}
              </div>

              {/* Term */}
              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                  Term *
                </label>
                <select
                  id="term"
                  className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.term ? 'border-red-300' : 'border-gray-300'}`}
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
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.term}</p>
                )}
              </div>

              {/* Amount Paid */}
              <div>
                <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">UGX</span>
                  </div>
                  <input
                    type="number"
                    id="amount_paid"
                    className={`block w-full pl-7 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.amount_paid ? 'border-red-300' : 'border-gray-300'}`}
                    value={formData.amount_paid}
                    onChange={(e) => handleInputChange('amount_paid', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                {fieldErrors.amount_paid && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.amount_paid}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  id="payment_method"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  id="payment_status"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  id="payment_date"
                  className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.payment_date ? 'border-red-300' : 'border-gray-300'}`}
                  value={formData.payment_date}
                  onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  required
                />
                {fieldErrors.payment_date && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.payment_date}</p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="due_date"
                  className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.due_date ? 'border-red-300' : 'border-gray-300'}`}
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  required
                />
                {fieldErrors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.due_date}</p>
                )}
              </div>

              {/* Scholarship */}
              <div>
                <label htmlFor="scholarship" className="block text-sm font-medium text-gray-700 mb-2">
                  Scholarship
                </label>
                <select
                  id="scholarship"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label htmlFor="discount_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">UGX</span>
                  </div>
                  <input
                    type="number"
                    id="discount_amount"
                    className="block w-full pl-7 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Optional notes about this payment..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/fees/payments"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips for recording payments</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Search for students by name or student ID</li>
                  <li>Ensure the student and category are correct before saving</li>
                  <li>Record the actual amount paid and payment method</li>
                  <li>Use notes for any special circumstances or clarifications</li>
                  <li>Only completed payments will be reflected in fee balances</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 