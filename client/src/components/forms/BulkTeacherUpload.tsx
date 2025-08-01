'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { teacherApi } from '@/lib/api';
import { useAppSelector } from '@/store';
import type { TeacherCreateUpdate } from '@/types';

interface BulkTeacherUploadProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface TeacherData {
  user_first_name: string;
  user_last_name: string;
  user_email?: string;
  user_phone?: string;
  user_dob?: string;
  user_gender?: 'M' | 'F' | 'O';
  user_emergency_contact?: string;
  user_emergency_phone?: string;
  user_emergency_contact_address?: string;
  user_emergency_contact_email?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
  specialization?: string;
  qualification?: string;
  hire_date?: string;
  years_of_experience?: number;
  previous_experience?: string;
  salary?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
}

export function BulkTeacherUpload({ isOpen = false, onClose, onSuccess }: BulkTeacherUploadProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [previewData, setPreviewData] = useState<TeacherData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const parseExcelFile = useCallback(async (selectedFile: File) => {
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        toast.error('Excel file must contain at least a header row and one data row');
        return;
      }
      
      // Extract headers and data
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as unknown[][];
      
      // Map Excel data to TeacherData format
      const teachers: TeacherData[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const teacher: Partial<TeacherData> = {};
        
        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (value !== undefined && value !== null && value !== '') {
            switch (header) {
              case 'First Name':
                teacher.user_first_name = String(value);
                break;
              case 'Last Name':
                teacher.user_last_name = String(value);
                break;
              case 'Email':
                teacher.user_email = String(value);
                break;
              case 'Phone Number':
                teacher.user_phone = String(value);
                break;
              case 'Date of Birth (YYYY-MM-DD)':
                teacher.user_dob = String(value);
                break;
              case 'Gender (M/F/O)':
                teacher.user_gender = String(value) as 'M' | 'F' | 'O';
                break;
              case 'Emergency Contact Name':
                teacher.user_emergency_contact = String(value);
                break;
              case 'Emergency Contact Phone':
                teacher.user_emergency_phone = String(value);
                break;
              case 'Emergency Contact Address':
                teacher.user_emergency_contact_address = String(value);
                break;
              case 'Emergency Contact Email':
                teacher.user_emergency_contact_email = String(value);
                break;
              case 'Employment Type':
                teacher.employment_type = String(value) as 'full_time' | 'part_time' | 'contract' | 'substitute' | 'volunteer';
                break;
              case 'Specialization':
                teacher.specialization = String(value);
                break;
              case 'Qualification':
                teacher.qualification = String(value);
                break;
              case 'Hire Date (YYYY-MM-DD)':
                teacher.hire_date = String(value);
                break;
              case 'Years of Experience':
                teacher.years_of_experience = Number(value);
                break;
              case 'Previous Experience':
                teacher.previous_experience = String(value);
                break;
              case 'Salary (UGX)':
                teacher.salary = String(value);
                break;
            }
          }
        });
        
        // Validate required fields
        if (teacher.user_first_name && teacher.user_last_name && teacher.employment_type) {
          teachers.push(teacher as TeacherData);
        }
      }
      
      if (teachers.length === 0) {
        toast.error('No valid teacher data found in the Excel file');
        return;
      }
      
      setPreviewData(teachers);
      const errors = validateData(teachers);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast.error(`Found ${errors.length} validation errors. Please check the data.`);
      } else {
        toast.success(`Successfully parsed ${teachers.length} teachers`);
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Error parsing Excel file. Please check the file format.');
    }
  }, []);

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

  const validateData = (data: TeacherData[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    data.forEach((teacher, index) => {
      const row = index + 2; // +2 because Excel is 1-indexed and we have a header row
      
      // Required fields
      if (!teacher.user_first_name?.trim()) {
        errors.push({ row, field: 'First Name', message: 'First name is required' });
      }
      if (!teacher.user_last_name?.trim()) {
        errors.push({ row, field: 'Last Name', message: 'Last name is required' });
      }
      if (!teacher.user_email?.trim()) {
        errors.push({ row, field: 'Email', message: 'Email is required' });
      }
      if (!teacher.employment_type) {
        errors.push({ row, field: 'Employment Type', message: 'Employment type is required' });
      }
      
      // Email validation
      if (teacher.user_email && !isValidEmail(teacher.user_email)) {
        errors.push({ row, field: 'Email', message: 'Invalid email format' });
      }
      
      // Phone validation
      if (teacher.user_phone && !isValidPhone(teacher.user_phone)) {
        errors.push({ row, field: 'Phone Number', message: 'Invalid phone number format' });
      }
      
      // Date validation
      if (teacher.user_dob && !isValidDate(teacher.user_dob)) {
        errors.push({ row, field: 'Date of Birth', message: 'Invalid date format (YYYY-MM-DD)' });
      }
      if (teacher.hire_date && !isValidDate(teacher.hire_date)) {
        errors.push({ row, field: 'Hire Date', message: 'Invalid date format (YYYY-MM-DD)' });
      }
      
      // Gender validation
      if (teacher.user_gender && !['M', 'F', 'O'].includes(teacher.user_gender)) {
        errors.push({ row, field: 'Gender', message: 'Gender must be M, F, or O' });
      }
      
      // Employment type validation
      if (teacher.employment_type && !['full_time', 'part_time', 'contract', 'substitute', 'volunteer'].includes(teacher.employment_type)) {
        errors.push({ row, field: 'Employment Type', message: 'Invalid employment type' });
      }
      
      // Years of experience validation
      if (teacher.years_of_experience !== undefined && (teacher.years_of_experience < 0 || teacher.years_of_experience > 50)) {
        errors.push({ row, field: 'Years of Experience', message: 'Years of experience must be between 0 and 50' });
      }
    });
    
    return errors;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  };

  const isValidDate = (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  };

  const downloadTemplate = () => {
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone Number': '+256701234567',
        'Date of Birth (YYYY-MM-DD)': '1985-03-15',
        'Gender (M/F/O)': 'M',
        'Emergency Contact Name': 'Jane Doe',
        'Emergency Contact Phone': '+256701234568',
        'Emergency Contact Address': '123 Main St, Kampala',
        'Emergency Contact Email': 'jane.doe@example.com',
        'Employment Type': 'full_time',
        'Specialization': 'Mathematics',
        'Qualification': 'Masters in Mathematics',
        'Hire Date (YYYY-MM-DD)': '2023-01-15',
        'Years of Experience': '5',
        'Previous Experience': 'Taught at Kampala High School for 3 years',
        'Salary (UGX)': '1500000'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone Number': '+256701234569',
        'Date of Birth (YYYY-MM-DD)': '1990-07-22',
        'Gender (M/F/O)': 'F',
        'Emergency Contact Name': 'John Smith',
        'Emergency Contact Phone': '+256701234570',
        'Emergency Contact Address': '456 Oak Ave, Kampala',
        'Emergency Contact Email': 'john.smith@example.com',
        'Employment Type': 'substitute',
        'Specialization': 'English Literature',
        'Qualification': 'Bachelors in English',
        'Hire Date (YYYY-MM-DD)': '2023-02-01',
        'Years of Experience': '3',
        'Previous Experience': 'Freelance tutor for 2 years',
        'Salary (UGX)': '800000'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers Template');
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `teachers_bulk_upload_template_${date}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    toast.success('Template downloaded successfully');
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to upload teachers.');
      return;
    }

    if (!previewData.length) {
      toast.error('No data to upload');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: previewData.length, percentage: 0 });

    try {
      // Transform all teachers to match the API structure
      const teachersData = previewData.map(teacher => {
        const apiData: Partial<TeacherCreateUpdate> = {
          employment_type: teacher.employment_type, // Required field
        };

        // Only add fields that have values
        if (teacher.user_email) apiData.user_email = teacher.user_email;
        if (teacher.user_first_name) apiData.user_first_name = teacher.user_first_name;
        if (teacher.user_last_name) apiData.user_last_name = teacher.user_last_name;
        if (teacher.user_gender) apiData.user_gender = teacher.user_gender;
        if (teacher.user_dob) apiData.user_dob = teacher.user_dob;
        if (teacher.user_phone) apiData.user_phone = teacher.user_phone;
        if (teacher.user_emergency_contact) apiData.user_emergency_contact = teacher.user_emergency_contact;
        if (teacher.user_emergency_phone) apiData.user_emergency_phone = teacher.user_emergency_phone;
        if (teacher.user_emergency_contact_address) apiData.user_emergency_contact_address = teacher.user_emergency_contact_address;
        if (teacher.user_emergency_contact_email) apiData.user_emergency_contact_email = teacher.user_emergency_contact_email;
        if (teacher.specialization) apiData.specialization = teacher.specialization;
        if (teacher.qualification) apiData.qualification = teacher.qualification;
        if (teacher.hire_date) apiData.hire_date = teacher.hire_date;
        if (teacher.years_of_experience !== undefined) apiData.years_of_experience = teacher.years_of_experience;
        if (teacher.previous_experience) apiData.previous_experience = teacher.previous_experience;
        if (teacher.salary) apiData.salary = teacher.salary;

        return apiData;
      });

      console.log('Attempting to create teachers with data:', teachersData);
      
      // Use the bulk upload endpoint
      const result = await teacherApi.bulkCreate(teachersData as TeacherCreateUpdate[]);
      
      console.log('Bulk upload result:', result);
      
      toast.success(`Successfully uploaded ${result.created_count} teachers`);
      
      // Reset form
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);
      setUploadProgress(null);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          return;
        }
      }
      
      toast.error('Upload failed. Please check your data and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setUploadProgress(null);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Teachers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <h3 className="font-medium mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                Authentication Required
              </h3>
              <p className="text-sm text-yellow-800">
                Please log in to upload teachers. You must be authenticated to use this feature.
              </p>
            </div>
          )}

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium text-blue-900">Download Template</h3>
              <p className="text-sm text-blue-700">
                Download the Excel template to see the required format and example data. 
                <strong>Email is required for all teachers.</strong>
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Excel File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to select file or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Excel (.xlsx, .xls) or CSV files only, max 5MB
                  </p>
                </label>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <h3 className="font-medium mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Validation Errors ({validationErrors.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800">
                    Row {error.row}: {error.field} - {error.message}
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
                <span>{uploadProgress.current}/{uploadProgress.total}</span>
              </div>
              <Progress value={uploadProgress.percentage} />
            </div>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Preview ({previewData.length} teachers)</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">Employment Type</th>
                      <th className="px-3 py-2 text-left">Specialization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((teacher, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">
                          {teacher.user_first_name} {teacher.user_last_name}
                        </td>
                        <td className="px-3 py-2">{teacher.user_email || '-'}</td>
                        <td className="px-3 py-2">{teacher.user_phone || '-'}</td>
                        <td className="px-3 py-2">{teacher.employment_type || '-'}</td>
                        <td className="px-3 py-2">{teacher.specialization || '-'}</td>
                      </tr>
                    ))}
                    {previewData.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                          ... and {previewData.length - 10} more teachers
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
            disabled={!isAuthenticated || !file || isUploading || validationErrors.length > 0}
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
                Upload {previewData.length} Teachers
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 