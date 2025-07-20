'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function CreateSubjectPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/members/subjects">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Subjects</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Subject</h1>
          <p className="text-gray-600 mt-1">Create a new academic subject for Pallisa High School</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Subject Information</span>
          </CardTitle>
          <CardDescription>
            Enter the details for the new academic subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Subject Creation Form</h3>
            <p className="text-gray-600 mb-4">
              Subject creation functionality will be implemented soon.
            </p>
            <p className="text-sm text-gray-500">
              This will include fields for subject name, code, description, and credit hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 