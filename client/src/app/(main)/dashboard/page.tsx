'use client';

import React from 'react';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Calendar,
  ChevronRight,
  GraduationCap,
  Clock,
  Settings
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Progress
} from '@/components/ui';
import { useAppSelector } from '@/store';
import Link from 'next/link';
import { FetchDashboardAnalytics } from '@/features/school/school.service';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, school } = useAppSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const res = await FetchDashboardAnalytics({school_id: Number(school?.id)});
      if (res.success) {
        setAnalytics(res.data);
      }
    };
    loadAnalytics();
  }, [school]);

  const stats = [
    {
      title: "Total Students",
      value: analytics ? analytics.total_students : "...",
      change: "",
      isPositive: true,
      icon: Users,
      bgColor: "bg-primary/10",
      textColor: "text-primary",
    },
    {
      title: "Total Teachers",
      value: analytics ? analytics.total_teachers : "...",
      change: "",
      isPositive: true,
      icon: UserCheck,
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-500",
    },
    {
      title: "Monthly Revenue",
      value: analytics ? analytics.monthly_revenue : "...",
      change: "",
      isPositive: true,
      icon: DollarSign,
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-500",
    },
    {
      title: "Monthly Expenses",
      value: analytics ? analytics.monthly_expenses : "...",
      change: "",
      isPositive: false,
      icon: CreditCard,
      bgColor: "bg-rose-500/10",
      textColor: "text-rose-500",
    },
  ];

  const recentTransactions = analytics ? analytics.recent_transactions : [];

  const quickActions = [
    { title: "Register Student", icon: Plus, href: "/members/students", color: "bg-primary" },
    { title: "Record Expense", icon: CreditCard, href: "/expenses", color: "bg-primary" },
    { title: "Collect Payment", icon: DollarSign, href: "/fees/payments", color: "bg-primary" },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {'Admin'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening at Pallisa High School today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            Term 1, 2026
          </Button>
          <Button className="h-11 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            New Enrollment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <Badge 
                variant={stat.isPositive ? "secondary" : "destructive"} 
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  stat.isPositive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""
                }`}
              >
                {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.change}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Fee Payments</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 hover:bg-primary/10 font-semibold" asChild>
                <Link href="/fees/payments">View All <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900">Student</TableHead>
                    <TableHead className="font-semibold text-gray-900">Category</TableHead>
                    <TableHead className="font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx: any) => (
                    <TableRow key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-2 ring-white">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {tx.student.split(' ').map((n: any) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {tx.student}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{tx.category}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{tx.date}</TableCell>
                      <TableCell className="font-bold text-gray-900">{tx.amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                          className={`rounded-full capitalize ${
                            tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Performance Summary (Placeholder) */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Enrollment Trends</h2>
            <div className="h-[200px] w-full flex items-end justify-between gap-2 px-2">
              {[65, 45, 75, 55, 90, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <div 
                    className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center font-medium">Day {i+1}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="h-14 justify-start px-4 hover:bg-gray-50 border-gray-100 rounded-2xl group transition-all"
                  asChild
                >
                  <Link href={action.href}>
                    <div className={`p-2 rounded-xl ${action.color} text-white mr-3 transition-transform group-hover:scale-110`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-700">{action.title}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-900" />
                  </Link>
                </Button>
              ))}
            </div>
          </Card>

          {/* Setup Progress */}
          <Card className="p-6 border-none bg-primary text-white shadow-xl shadow-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold">School Setup</h2>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Complete your school profile to unlock all features.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <Progress value={65} className="h-2 bg-white/20" />
            </div>
            <Button className="w-full mt-6 bg-white text-primary hover:bg-white/90 border-none font-bold h-11 rounded-xl shadow-md hover:-translate-y-0.5 transition-all">
              Finish Setup
            </Button>
          </Card>

          {/* Activity Feed */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Activity</h2>
            <div className="space-y-4">
              {[
                { text: "New staff member registered", time: "2 hours ago", icon: UserCheck, color: "text-emerald-500" },
                { text: "Monthly expense report generated", time: "5 hours ago", icon: Clock, color: "text-blue-500" },
                { text: "Fee category 'Lab Fees' updated", time: "Yesterday", icon: Settings, color: "text-amber-500" },
              ].map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
