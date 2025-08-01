'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Users, CheckCircle, AlertCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { studentApi } from '@/lib/api';
import type { StudentCreateUpdate } from '@/types';

interface StudentData {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  stream_id?: number;
  previous_school?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: ValidationError[];
}

interface BulkStudentUploadProps {
  onSuccess?: () => void;
}

export function BulkStudentUpload({ onSuccess }: BulkStudentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [previewData, setPreviewData] = useState<StudentData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateData = useCallback((data: StudentData[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    data.forEach((student, index) => {
      const row = index + 2; // +2 because Excel is 1-indexed and we skip header
      
      if (!student.email?.trim()) {
        errors.push({ row, field: 'Email', message: 'Email is required' });
      } else if (!isValidEmail(student.email)) {
        errors.push({ row, field: 'Email', message: 'Invalid email format' });
      }
      
      if (!student.first_name?.trim()) {
        errors.push({ row, field: 'First Name', message: 'First name is required' });
      }
      
      if (!student.last_name?.trim()) {
        errors.push({ row, field: 'Last Name', message: 'Last name is required' });
      }
      
      if (student.phone_number && !isValidPhone(student.phone_number)) {
        errors.push({ row, field: 'Phone Number', message: 'Invalid phone number format' });
      }
      
      if (student.date_of_birth && !isValidDate(student.date_of_birth)) {
        errors.push({ row, field: 'Date of Birth', message: 'Invalid date format' });
      }
    });
    
    return errors;
  }, []);

  const parseExcelFile = useCallback((file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file must have at least a header row and one data row'));
            return;
          }
          
          const students: StudentData[] = [];
          const headers = jsonData[0] as string[];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];
            if (row.length === 0 || row.every(cell => !cell)) continue;
            
            const student: StudentData = {
              first_name: '',
              last_name: '',
              email: '',
              phone_number: '',
              date_of_birth: '',
              gender: 'male',
              address: '',
              parent_name: '',
              parent_phone: '',
              parent_email: '',
              stream_id: undefined,
              previous_school: '',
              special_needs: '',
              medical_conditions: '',
              allergies: ''
            };
            
            headers.forEach((header, index) => {
              const value = row[index];
              if (value !== undefined && value !== null && value !== '') {
                switch (header) {
                  case 'First Name':
                    student.first_name = String(value);
                    break;
                  case 'Last Name':
                    student.last_name = String(value);
                    break;
                  case 'Email':
                    student.email = String(value);
                    break;
                  case 'Phone Number':
                    student.phone_number = String(value);
                    break;
                  case 'Date of Birth':
                    student.date_of_birth = String(value);
                    break;
                  case 'Gender':
                    const gender = String(value).toLowerCase();
                    if (['male', 'female', 'other'].includes(gender)) {
                      student.gender = gender as 'male' | 'female' | 'other';
                    }
                    break;
                  case 'Address':
                    student.address = String(value);
                    break;
                  case 'Parent Name':
                    student.parent_name = String(value);
                    break;
                  case 'Parent Phone':
                    student.parent_phone = String(value);
                    break;
                  case 'Parent Email':
                    student.parent_email = String(value);
                    break;
                  case 'Stream ID':
                    const streamId = parseInt(String(value));
                    if (!isNaN(streamId)) {
                      student.stream_id = streamId;
                    }
                    break;
                  case 'Previous School':
                    student.previous_school = String(value);
                    break;
                  case 'Special Needs':
                    student.special_needs = String(value);
                    break;
                  case 'Medical Conditions':
                    student.medical_conditions = String(value);
                    break;
                  case 'Allergies':
                    student.allergies = String(value);
                    break;
                }
              }
            });
            
            students.push(student);
          }
          
          setPreviewData(students);
          const errors = validateData(students);
          setValidationErrors(errors);
          
          if (errors.length > 0) {
            toast.error(`Found ${errors.length} validation errors. Please fix them before uploading.`);
          } else {
            toast.success(`Successfully parsed ${students.length} students from file.`);
          }
          
          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, [validateData]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setUploadProgress(null);
    parseExcelFile(selectedFile);
  }, [parseExcelFile]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Allow various phone formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const isValidDate = (date: string): boolean => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error(`Please fix ${validationErrors.length} validation errors before uploading`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      total: previewData.length,
      processed: 0,
      success: 0,
      failed: 0,
      errors: []
    });

    try {
      // Transform all students to match the API structure
      const studentsData = previewData.map(student => {
        const apiData: Partial<StudentCreateUpdate> = {
          enrollment_status: 'enrolled', // Required field
        };

        // Only add fields that have values
        if (student.email) apiData.user_email = student.email;
        if (student.first_name) apiData.user_first_name = student.first_name;
        if (student.last_name) apiData.user_last_name = student.last_name;
        if (student.gender) {
          apiData.user_gender = student.gender === 'male' ? 'M' : student.gender === 'female' ? 'F' : 'O';
        }
        if (student.date_of_birth) apiData.user_dob = student.date_of_birth;
        if (student.phone_number) apiData.user_phone = student.phone_number;
        if (student.parent_name) apiData.user_emergency_contact = student.parent_name;
        if (student.parent_phone) apiData.user_emergency_phone = student.parent_phone;
        if (student.address) apiData.user_emergency_contact_address = student.address;
        if (student.parent_email) apiData.user_emergency_contact_email = student.parent_email;
        if (student.stream_id) apiData.current_stream = student.stream_id;
        if (student.previous_school) apiData.previous_school = student.previous_school;
        if (student.special_needs) apiData.special_needs = student.special_needs;
        if (student.medical_conditions) apiData.medical_conditions = student.medical_conditions;
        if (student.allergies) apiData.allergies = student.allergies;

        return apiData;
      });

      console.log('Attempting to create students with data:', studentsData);
      
      // Use the bulk upload endpoint
      const result = await studentApi.bulkCreate(studentsData as StudentCreateUpdate[]);

      console.log('Bulk upload successful:', result);
      setUploadProgress(prev => prev ? {
        ...prev,
        processed: prev.total,
        success: result.created_count || prev.total,
        failed: 0
      } : null);
      
      toast.success(`Successfully uploaded ${result.created_count} students!`);
      onSuccess?.(); // Call the success callback

      // Reset form
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);
      setUploadProgress(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle partial success if available
      if (error?.response?.data) {
        const errorData = error.response.data;
        const createdCount = errorData.created_count || 0;
        const failedCount = errorData.failed_count || 0;
        
        setUploadProgress(prev => prev ? {
          ...prev,
          processed: prev.total,
          success: createdCount,
          failed: failedCount,
          errors: errorData.errors ? errorData.errors.map((error: any, index: number) => ({
            row: index + 1,
            field: 'general',
            message: JSON.stringify(error)
          })) : []
        } : null);
        
        if (createdCount > 0) {
          toast.warning(`Uploaded ${createdCount} students, ${failedCount} failed`);
        } else {
          toast.error('Bulk upload failed');
        }
      } else {
        setUploadProgress(prev => prev ? {
          ...prev,
          processed: prev.total,
          failed: prev.total
        } : null);
        toast.error('Upload failed. Please check your data and try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone Number': '+256701234567',
        'Date of Birth': '2005-03-15',
        'Gender': 'male',
        'Address': '123 Main St, Kampala',
        'Parent Name': 'Jane Doe',
        'Parent Phone': '+256701234568',
        'Parent Email': 'jane.doe@example.com',
        'Stream ID': '', // Optional - leave blank if not assigned yet
        'Previous School': 'Kampala Primary School',
        'Special Needs': 'None',
        'Medical Conditions': 'None',
        'Allergies': 'None'
      },
      {
        'First Name': 'Sarah',
        'Last Name': 'Smith',
        'Email': 'sarah.smith@example.com',
        'Phone Number': '+256701234569',
        'Date of Birth': '2006-07-22',
        'Gender': 'female',
        'Address': '456 Oak Ave, Entebbe',
        'Parent Name': 'Michael Smith',
        'Parent Phone': '+256701234570',
        'Parent Email': 'michael.smith@example.com',
        'Stream ID': 2, // Optional - can be assigned later
        'Previous School': 'Entebbe Junior School',
        'Special Needs': 'Dyslexia support needed',
        'Medical Conditions': 'Asthma',
        'Allergies': 'Peanuts'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    
    XLSX.writeFile(wb, 'students_upload_template.xlsx');
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setUploadProgress(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Student Upload
          </CardTitle>
          <CardDescription>
            Upload multiple students at once using an Excel file. Download the template below to see the required format.
            Note: Student ID and Admission Number are auto-generated by the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Download Section */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700">
                  Get the Excel template with the correct format and example data
                </p>
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to upload Excel file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports .xlsx, .xls, .csv (max 5MB)
                    </p>
                  </div>
                </label>

              </div>
              {file && (
                <Button onClick={clearFile} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-red-900">
                    {validationErrors.length} Validation Error{validationErrors.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">Row {error.row}:</span> {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress.processed}/{uploadProgress.total}</span>
                </div>
                <Progress value={(uploadProgress.processed / uploadProgress.total) * 100} />
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {uploadProgress.success} Success
                  </span>
                  {uploadProgress.failed > 0 && (
                    <span className="text-red-600">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {uploadProgress.failed} Failed
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Preview Data */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Preview ({previewData.length} students)</h3>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Phone</th>
                        <th className="px-3 py-2 text-left">Gender</th>
                        <th className="px-3 py-2 text-left">Stream ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((student, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-3 py-2">{student.email || '-'}</td>
                          <td className="px-3 py-2">{student.phone_number || '-'}</td>
                          <td className="px-3 py-2">{student.gender || '-'}</td>
                          <td className="px-3 py-2">{student.stream_id || '-'}</td>
                        </tr>
                      ))}
                      {previewData.length > 10 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                            ... and {previewData.length - 10} more students
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading || validationErrors.length > 0}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {previewData.length} Students
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 