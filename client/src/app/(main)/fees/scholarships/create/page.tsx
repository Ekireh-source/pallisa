"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Search, User, Award, AlertCircle, Info } from 'lucide-react';
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

export default function CreateScholarshipPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    student: "",
    scholarship_name: "",
    academic_year: "",
    term: "",
    amount: "",
    is_active: true,
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [studentsData, yearsData, termsData] = await Promise.all([
          apiGet<{ results: Option[] }>(API_ENDPOINTS.MEMBERS_STUDENTS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.ACADEMIC_YEARS),
          apiGet<{ results: Option[] }>(API_ENDPOINTS.TERMS),
        ]);
        
        setStudents(studentsData.results || studentsData);
        setYears(yearsData.results || yearsData);
        setTerms(termsData.results || termsData);
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
    if (!formData.scholarship_name) errors.scholarship_name = 'Scholarship name is required';
    if (!formData.academic_year) errors.academic_year = 'Academic year is required';
    if (!formData.term) errors.term = 'Term is required';
    if (!formData.amount) errors.amount = 'Amount is required';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      await apiPost(API_ENDPOINTS.FEES + 'scholarships/', {
        student: parseInt(formData.student),
        scholarship_name: formData.scholarship_name,
        academic_year: parseInt(formData.academic_year),
        term: parseInt(formData.term),
        amount: parseFloat(formData.amount),
        is_active: formData.is_active,
      });
      router.push("/fees/scholarships");
    } catch (err) {
      setError("Failed to create scholarship");
      console.error('Error creating scholarship:', err);
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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create Scholarship</h1>
            <p className="text-blue-100 text-lg">
              Add a new scholarship or award for a student
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-blue-100">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span className="text-sm">New Scholarship Creation</span>
            </div>
          </div>
          <Link
            href="/fees/scholarships"
            className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scholarships
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Error Creating Scholarship
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="w-5 h-5 mr-2 text-blue-600" />
            Scholarship Information
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Search */}
          <div>
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
              Student *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="student"
                className={`block w-full pl-12 pr-3 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${fieldErrors.student ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <span className="text-green-600 text-sm font-medium">
                    ✓ {getSelectedStudentName()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Student Dropdown */}
            {showStudentDropdown && filteredStudents.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-blue-50 transition-colors"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
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
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{fieldErrors.student}</p>
              </div>
            )}
          </div>

          {/* Scholarship Name */}
          <div>
            <label htmlFor="scholarship_name" className="block text-sm font-medium text-gray-700 mb-2">
              Scholarship Name *
            </label>
            <input
              type="text"
              id="scholarship_name"
              className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${fieldErrors.scholarship_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
              value={formData.scholarship_name}
              onChange={(e) => handleInputChange('scholarship_name', e.target.value)}
              placeholder="Enter scholarship or award name"
              maxLength={100}
              required
            />
            {fieldErrors.scholarship_name && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{fieldErrors.scholarship_name}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Academic Year */}
            <div>
              <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                id="academic_year"
                className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${fieldErrors.academic_year ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{fieldErrors.academic_year}</p>
                </div>
              )}
            </div>

            {/* Term */}
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                Term *
              </label>
              <select
                id="term"
                className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${fieldErrors.term ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{fieldErrors.term}</p>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">UGX</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  className={`block w-full pl-12 px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${fieldErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              {fieldErrors.amount && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{fieldErrors.amount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <input
              type="checkbox"
              id="is_active"
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
            />
            <label htmlFor="is_active" className="ml-3 block text-sm text-gray-900">
              <span className="font-medium">Active</span>
              <span className="text-gray-600 ml-1">(scholarship can be used for new fees)</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/fees/scholarships"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 w-full sm:w-auto"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Scholarship
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Tips for Creating Scholarships
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">1</span>
              </div>
              <p className="text-gray-700">Search for students by name or student ID</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">2</span>
              </div>
              <p className="text-gray-700">Assign each scholarship to a specific student, academic year, and term</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">3</span>
              </div>
              <p className="text-gray-700">Use clear, descriptive names for scholarships and awards</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">4</span>
              </div>
              <p className="text-gray-700">Amount should reflect the total value of the scholarship</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">5</span>
              </div>
              <p className="text-gray-700">Only active scholarships will be available for new fee assignments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 