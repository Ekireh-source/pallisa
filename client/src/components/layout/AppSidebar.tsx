"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

const feesManagementItems = [
  {
    title: "Fee Categories",
    url: "/fees/categories",
    icon: Tags,
  },
  {
    title: "Fee Structures",
    url: "/fees/structures",
    icon: Layers,
  },
  {
    title: "Fee Payments",
    url: "/fees/payments",
    icon: CreditCard,
  },
  {
    title: "Student Fee Balances",
    url: "/fees/balances",
    icon: Wallet,
  },
  {
    title: "Fee Collection Summaries",
    url: "/fees/collection-summaries",
    icon: BarChart3,
  },
  // {
  //   title: "Student Fee Overrides",
  //   url: "/fees/overrides",
  //   icon: UserCheck,
  // },
  {
    title: "Scholarships",
    url: "/fees/scholarships",
    icon: GraduationCap,
  },
]

const navigationItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: CreditCard,
    badge: "12",
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Tags,
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building2,
  },
  {
    title: "Vendors",
    url: "/vendors",
    icon: Users,
  },
  {
    title: "Terms",
    url: "/terms",
    icon: Calendar,
  },
  {
    title: "Academic Years",
    url: "/academic-years",
    icon: GraduationCap,
  },
]



const systemAdminItems = [
  {
    title: "Roles & Permissions",
    url: "/roles",
    icon: Shield,
  },
  
]

const membersItems = [
  {
    title: "Students",
    url: "/members/students",
    icon: Users,
  },
  {
    title: "Teachers",
    url: "/members/teachers",
    icon: UserCheck,
  },
  {
    title: "Non-Staff Members",
    url: "/members/non-staff-members",
    icon: Users2,
  },
  {
    title: "Parents",
    url: "/members/parents",
    icon: Users2,
  },
  {
    title: "Classes",
    url: "/members/classes",
    icon: Building,
  },
  {
    title: "Streams",
    url: "/members/streams",
    icon: Layers,
  },
  {
    title: "Subjects",
    url: "/members/subjects",
    icon: BookOpen,
  },
]

const salaryManagementItems = [
  {
    title: "Salary Management",
    url: "/salary-management",
    icon: DollarSign,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

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

  const userDisplayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.email || "Admin User"

  const userEmail = user?.email || "admin@university.edu"

  return (
    <Sidebar className="border-r border-gray-200 bg-gray-50 py-1" collapsible="icon">
      <SidebarHeader className="px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {/* <GraduationCap className="w-4 h-4 text-white" /> */}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-900 text-sm block truncate">Pallisa Expense Manager</span>
            <p className="text-xs text-gray-500 truncate">Expense Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-50">
        {/* Expense Management Section */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
            Expense Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
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
        </SidebarGroup>

        {/* Fees Management Section */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
            Fees Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {feesManagementItems.map((item) => (
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
        </SidebarGroup>

        {/* Members Management Section */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
            Members Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {membersItems.map((item) => (
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
        </SidebarGroup>

        {/* Salary Management Section */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
            Salary Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {salaryManagementItems.map((item) => (
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
        </SidebarGroup>

        

        {/* System Administration Section */}
        <SidebarGroup className="px-3 py-2">
          <SidebarGroupLabel className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2">
            System Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemAdminItems.map((item) => (
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
        </SidebarGroup>
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