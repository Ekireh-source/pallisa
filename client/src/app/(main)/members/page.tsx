'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentStatistics } from '@/store/slices/memberStudentSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  BookOpen,
  Building2,
  UserPlus,
  BarChart3,
  Settings,
  Users2,
  Baby
} from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { statistics, loading } = useAppSelector((state) => state.memberStudents);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchStudentStatistics());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const memberStats = [
    {
      title: "Total Students",
      value: statistics?.total_students || 0,
      change: `${statistics?.enrolled || 0} enrolled`,
      changeType: "positive" as const,
      icon: GraduationCap,
      description: "Active students",
      href: "/members/students"
    },
    {
      title: "Teachers",
      value: "124",
      change: "+3 this month",
      changeType: "positive" as const,
      icon: UserCheck,
      description: "Teaching staff",
      href: "/members/teachers"
    },
    {
      title: "Parents",
      value: "267",
      change: "+12 new",
      changeType: "positive" as const,
      icon: Baby,
      description: "Parent accounts",
      href: "/members/parents"
    },
    {
      title: "Classes",
      value: "18",
      change: "6 streams",
      changeType: "neutral" as const,
      icon: BookOpen,
      description: "Academic classes",
      href: "/members/classes"
    }
  ];

  const quickActions = [
    {
      title: "Add Student",
      description: "Register a new student",
      href: "/members/students/create",
      icon: UserPlus,
      color: "bg-blue-500"
    },
    {
      title: "Add Teacher",
      description: "Add teaching staff",
      href: "/members/teachers/create",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Add Parent",
      description: "Register parent account",
      href: "/members/parents/create",
      icon: Users2,
      color: "bg-purple-500"
    },
    {
      title: "Member Reports",
      description: "View member analytics",
      href: "/members/reports",
      icon: BarChart3,
      color: "bg-orange-500"
    }
  ];

  const memberCategories = [
    {
      title: "Students",
      description: "Manage student enrollment, records, and academic information",
      icon: GraduationCap,
      count: statistics?.total_students || 0,
      href: "/members/students",
      color: "border-blue-200 hover:border-blue-300 bg-blue-50"
    },
    {
      title: "Teachers",
      description: "Manage teaching staff, assignments, and qualifications",
      icon: UserCheck,
      count: 124,
      href: "/members/teachers",
      color: "border-green-200 hover:border-green-300 bg-green-50"
    },
    {
      title: "Parents",
      description: "Manage parent accounts and student relationships",
      icon: Baby,
      count: 267,
      href: "/members/parents",
      color: "border-purple-200 hover:border-purple-300 bg-purple-50"
    },
    {
      title: "Classes & Streams",
      description: "Organize academic classes and student streams",
      icon: BookOpen,
      count: 18,
      href: "/members/classes",
      color: "border-indigo-200 hover:border-indigo-300 bg-indigo-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Members Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage students, teachers, parents, and academic organization.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {memberStats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span 
                    className={`font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'neutral' ? 'text-gray-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Member Categories */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Member Categories</CardTitle>
          <CardDescription>
            Access different member management sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberCategories.map((category, index) => (
              <Link key={index} href={category.href}>
                <div className={`p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer ${category.color}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <category.icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{category.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm font-medium">
                      {category.count}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          <CardDescription>
            Frequently used member management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Statistics Overview */}
      {statistics && (
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Student Overview</CardTitle>
            <CardDescription>
              Current student enrollment statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{statistics.enrolled}</div>
                <div className="text-xs text-green-600">Enrolled</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{statistics.transferred}</div>
                <div className="text-xs text-blue-600">Transferred</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{statistics.graduated}</div>
                <div className="text-xs text-purple-600">Graduated</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{statistics.suspended}</div>
                <div className="text-xs text-yellow-600">Suspended</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{statistics.withdrawn}</div>
                <div className="text-xs text-red-600">Withdrawn</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 