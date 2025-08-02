"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  GraduationCap,
  Home,
  Settings,
  Tags,
  Users,
  Wallet,
  Users2,
  UserCheck,
  BookOpen,
  Building,
  Layers,
  Shield,
  DollarSign,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroupAction,

} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store"
import { logoutUser } from "@/store/slices/authSlice"
import { cn } from "@/lib/utils"
import { 
  canAccessSection, 
  canAccessItem, 
  PERMISSIONS 
} from "@/lib/permissions"

const feesManagementItems = [
  {
    title: "Fee Categories",
    url: "/fees/categories",
    icon: Tags,
    permission: PERMISSIONS.VIEW_FEE_CATEGORIES,
  },
  {
    title: "Fee Structures",
    url: "/fees/structures",
    icon: Layers,
    permission: PERMISSIONS.VIEW_FEE_STRUCTURES,
  },
  {
    title: "Fee Payments",
    url: "/fees/payments",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_FEE_PAYMENTS,
  },
  {
    title: "Student Fee Balances",
    url: "/fees/balances",
    icon: Wallet,
    permission: PERMISSIONS.VIEW_FEE_BALANCES,
  },
  {
    title: "Fee Collection Summaries",
    url: "/fees/collection-summaries",
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_FEE_SUMMARIES,
  },
  {
    title: "Scholarships",
    url: "/fees/scholarships",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_SCHOLARSHIPS,
  },
]

const navigationItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: CreditCard,
    badge: "12",
    permission: PERMISSIONS.VIEW_EXPENSES,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Tags,
    permission: PERMISSIONS.VIEW_CATEGORIES,
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building2,
    permission: PERMISSIONS.VIEW_DEPARTMENTS,
  },
  {
    title: "Vendors",
    url: "/vendors",
    icon: Users,
    permission: PERMISSIONS.VIEW_VENDORS,
  },
  {
    title: "Terms",
    url: "/terms",
    icon: Calendar,
    permission: PERMISSIONS.VIEW_TERMS,
  },
  {
    title: "Academic Years",
    url: "/academic-years",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_ACADEMIC_YEARS,
  },
]

const systemAdminItems = [
  {
    title: "Roles & Permissions",
    url: "/roles",
    icon: Shield,
    permission: PERMISSIONS.MANAGE_ROLES,
  },
]

const membersItems = [
  {
    title: "Students",
    url: "/members/students",
    icon: Users,
    permission: PERMISSIONS.VIEW_STUDENTS,
  },
  {
    title: "Teachers",
    url: "/members/teachers",
    icon: UserCheck,
    permission: PERMISSIONS.VIEW_TEACHERS,
  },
  {
    title: "Non-Staff Members",
    url: "/members/non-staff-members",
    icon: Users2,
    permission: PERMISSIONS.VIEW_NON_STAFF,
  },
  {
    title: "Parents",
    url: "/members/parents",
    icon: Users2,
    permission: PERMISSIONS.VIEW_PARENTS,
  },
  {
    title: "Classes",
    url: "/members/classes",
    icon: Building,
    permission: PERMISSIONS.VIEW_CLASSES,
  },
  {
    title: "Streams",
    url: "/members/streams",
    icon: Layers,
    permission: PERMISSIONS.VIEW_STREAMS,
  },
  {
    title: "Subjects",
    url: "/members/subjects",
    icon: BookOpen,
    permission: PERMISSIONS.VIEW_SUBJECTS,
  },
]

const salaryManagementItems = [
  {
    title: "Allowances",
    url: "/salary-management/allowances",
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_SALARY_ALLOWANCES,
  },
  {
    title: "Deductions",
    url: "/salary-management/deductions",
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_SALARY_DEDUCTIONS,
  },
  {
    title: "Payments",
    url: "/salary-management/payments",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_SALARY_PAYMENTS,
  },
  {
    title: "Periods",
    url: "/salary-management/periods",
    icon: Calendar,
    permission: PERMISSIONS.VIEW_SALARY_PERIODS,
  }
 
]

export function AppSidebar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  // State for managing collapsed groups - all collapsed by default
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    expenseManagement: true,
    feesManagement: true,
    membersManagement: true,
    salaryManagement: true,
    systemAdmin: true,
  })

  const isActive = (url: string) => {
    if (url === '/dashboard') {
      return pathname === url
    }
    return pathname.startsWith(url)
  }

  const handleLogout = () => {
    dispatch(logoutUser())
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "AD"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const userDisplayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.email || "Admin User"

  const userEmail = user?.email || "admin@university.edu"

  // Filter items based on permissions
  const filteredNavigationItems = navigationItems.filter(item => 
    canAccessItem(user, item.permission)
  )
  
  const filteredFeesManagementItems = feesManagementItems.filter(item => 
    canAccessItem(user, item.permission)
  )
  
  const filteredMembersItems = membersItems.filter(item => 
    canAccessItem(user, item.permission)
  )
  
  const filteredSalaryManagementItems = salaryManagementItems.filter(item => 
    canAccessItem(user, item.permission)
  )
  
  const filteredSystemAdminItems = systemAdminItems.filter(item => 
    canAccessItem(user, item.permission)
  )

  return (
    <Sidebar className="border-r border-gray-200 bg-gray-50 py-1" collapsible="icon">
      <SidebarHeader className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 text-sm block truncate">Pallisa High School</span>
            <p className="text-xs text-gray-500 truncate">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-50">
        {/* Expense Management Section - Collapsible */}
        {canAccessSection(user, 'EXPENSE_MANAGEMENT') && filteredNavigationItems.length > 0 && (
          <SidebarGroup className="px-3 py-2">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
                Expense Management
              </SidebarGroupLabel>
              <SidebarGroupAction
                onClick={() => toggleGroup('expenseManagement')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {collapsedGroups.expenseManagement ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </SidebarGroupAction>
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsedGroups.expenseManagement ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredNavigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
                            isActive(item.url)
                              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                              : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}

        {/* Fees Management Section - Collapsible */}
        {canAccessSection(user, 'FEES_MANAGEMENT') && filteredFeesManagementItems.length > 0 && (
          <SidebarGroup className="px-3 py-2">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
                Fees Management
              </SidebarGroupLabel>
              <SidebarGroupAction
                onClick={() => toggleGroup('feesManagement')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {collapsedGroups.feesManagement ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </SidebarGroupAction>
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsedGroups.feesManagement ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredFeesManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
                            isActive(item.url)
                              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                              : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}

        {/* Members Management Section - Collapsible */}
        {canAccessSection(user, 'MEMBERS_MANAGEMENT') && filteredMembersItems.length > 0 && (
          <SidebarGroup className="px-3 py-2">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
                Members Management
              </SidebarGroupLabel>
              <SidebarGroupAction
                onClick={() => toggleGroup('membersManagement')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {collapsedGroups.membersManagement ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </SidebarGroupAction>
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsedGroups.membersManagement ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredMembersItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
                            isActive(item.url)
                              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                              : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}

        {/* Salary Management Section - Collapsible */}
        {canAccessSection(user, 'SALARY_MANAGEMENT') && filteredSalaryManagementItems.length > 0 && (
          <SidebarGroup className="px-3 py-2">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
                Salary Management
              </SidebarGroupLabel>
              <SidebarGroupAction
                onClick={() => toggleGroup('salaryManagement')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {collapsedGroups.salaryManagement ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </SidebarGroupAction>
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsedGroups.salaryManagement ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredSalaryManagementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
                            isActive(item.url)
                              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                              : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}

        {/* System Administration Section - Collapsible */}
        {canAccessSection(user, 'SYSTEM_ADMIN') && filteredSystemAdminItems.length > 0 && (
          <SidebarGroup className="px-3 py-2">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
                System Administration
              </SidebarGroupLabel>
              <SidebarGroupAction
                onClick={() => toggleGroup('systemAdmin')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {collapsedGroups.systemAdmin ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </SidebarGroupAction>
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              collapsedGroups.systemAdmin ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredSystemAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
                            isActive(item.url)
                              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                              : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-gray-50 border-t border-gray-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-white data-[state=open]:shadow-sm hover:bg-white hover:shadow-sm"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/placeholder-user.jpg" alt={userDisplayName} />
                    <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600">
                      {getUserInitials(userDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900">{userDisplayName}</span>
                    <span className="truncate text-xs text-gray-500">{userEmail}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt={userDisplayName} />
                      <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600">
                        {getUserInitials(userDisplayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userDisplayName}</span>
                      <span className="truncate text-xs text-gray-500">{userEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 