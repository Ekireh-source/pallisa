'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchStudentStatistics } from '@/store/slices/memberStudentSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  UserPlus, 
  Calendar,
  ArrowRight,
  BookOpen,
  Building2,
  Activity,
  Zap
} from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { statistics } = useAppSelector((state) => state.memberStudents);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
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
      href: "/members/students",
      gradient: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Teachers",
      value: "124",
      change: "+3 this month",
      changeType: "positive" as const,
      icon: UserCheck,
      description: "Teaching staff",
      href: "/members/teachers",
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      title: "Parents",
      value: "267",
      change: "+12 new",
      changeType: "positive" as const,
      icon: UserPlus,
      description: "Parent accounts",
      href: "/members/parents",
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Classes",
      value: "18",
      change: "6 streams",
      changeType: "positive" as const,
      icon: Calendar,
      description: "Academic classes",
      href: "/members/classes",
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  const quickActions = [
    {
      title: "Add Student",
      description: "Register a new student",
      href: "/members/students/create",
      icon: UserPlus,
      gradient: "from-blue-500 to-indigo-500",
      hoverGradient: "from-blue-600 to-indigo-600"
    },
    {
      title: "Add Teacher",
      description: "Add teaching staff",
      href: "/members/teachers/create",
      icon: Users,
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "from-green-600 to-emerald-600"
    },
    {
      title: "Add Parent",
      description: "Register parent account",
      href: "/members/parents/create",
      icon: UserPlus,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Manage Classes",
      description: "Organize academic classes",
      href: "/members/classes",
      icon: Building2,
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "from-orange-600 to-red-600"
    }
  ];

  const additionalStats = [
    {
      title: "Subjects",
      value: "25",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: "Academic subjects"
    },
    {
      title: "Streams",
      value: "6",
      icon: Activity,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      description: "Class streams"
    },
    {
      title: "Enrollment Rate",
      value: "94%",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Current term"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Member Management</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive management of students, teachers, parents, and academic structures
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-blue-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Total Members: {statistics?.total_students || 0}</span>
          </div>
          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Active Academic Year</span>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {memberStats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span 
                    className={`font-medium px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 
                      stat.changeType === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="hidden sm:inline">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {additionalStats.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Frequently used actions for member management and administration
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="group p-4 rounded-xl border border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{action.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Status */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Student Enrollment Status</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Current student enrollment breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-900">Enrolled</span>
                  </div>
                  <span className="text-2xl font-bold text-green-900">{statistics.enrolled || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="font-semibold text-yellow-900">Transferred</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">{statistics.transferred || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-blue-900">Graduated</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{statistics.graduated || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Distribution */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <span>Class Distribution</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Students by class level
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statistics.by_class && Object.entries(statistics.by_class).slice(0, 5).map(([className, count]) => (
                  <div key={className} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">{className}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                          style={{ width: `${(count / (statistics.total_students || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/members/students">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Students</h3>
                  <p className="text-sm text-gray-500">Manage student records</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members/teachers">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Teachers</h3>
                  <p className="text-sm text-gray-500">Manage teaching staff</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members/parents">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Parents</h3>
                  <p className="text-sm text-gray-500">Manage parent accounts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members/classes">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Classes</h3>
                  <p className="text-sm text-gray-500">Manage academic classes</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors ml-auto" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 