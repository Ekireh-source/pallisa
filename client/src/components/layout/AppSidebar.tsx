'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserCog, 
  Contact, 
  School, 
  Split, 
  BookOpen, 
  Wallet, 
  Tags, 
  Building2, 
  Truck, 
  Calendar, 
  History,
  PlusCircle,
  Settings,
  LogOut,
  ChevronRight,
  User,
  FileText,
  Layers,
  Puzzle
} from 'lucide-react';

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutStart } from '@/store/auth/actions';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Academic',
    icon: GraduationCap,
    items: [
      { title: 'Academic Years', url: '/academic-years' },
      { title: 'Terms', url: '/terms' },
      { title: 'Classes', url: '/classes' },
      { title: 'Streams', url: '/streams' },
      { title: 'Subjects', url: '/subjects' },
      { title: 'Topics', url: '/topics' },
      { title: 'Reports', url: '/reports' },
      { title: 'Grading System', url: '/grading' },
    ],
  },
  {
    title: 'Assessments',
    icon: FileText,
    items: [
      { title: 'Exams', url: '/exams' },
      { title: 'Competency Areas', url: '/competences' },
      { title: 'Activity of Integration', url: '/activity-of-integration' },
      { title: 'Topics', url: '/topics' },
    ],
  },
  {
    title: 'Members',
    icon: Users,
    items: [
      { title: 'Students', url: '/students' },
      { title: 'Teachers', url: '/teachers' },
      { title: 'Non-Staff Members', url: '/non-staff-members' },
      { title: 'Parents', url: '/parents' },
    ],
  },
  {
    title: 'Management',
    icon: Building2,
    items: [
      { title: 'School Info', url: '/school' },
      { title: 'Campuses', url: '/campuses' },
      { title: 'Departments', url: '/departments' },
      { title: 'Vendors', url: '/vendors' },
    ],
  },
  {
    title: 'Finance',
    icon: Wallet,
    items: [
      { title: 'Expenses', url: '/expenses' },
      { title: 'Categories', url: '/categories' },
    ],
  },
];

const quickActions = [
  { title: 'Enroll Student', url: '/students/create', color: 'text-blue-500' },
  { title: 'Add Teacher', url: '/teachers/create', color: 'text-indigo-500' },
  { title: 'Add Expense', url: '/expenses/create', color: 'text-green-500' },
  { title: 'Create Exam', url: '/exams/create', color: 'text-rose-500' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user: userState, school } = useSelector((state: RootState) => state.auth);
  const user = userState.value;
  const { state } = useSidebar();
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  React.useEffect(() => {
    // Auto-open groups based on current path
    const activeGroup = navItems.find(item => 
      item.items?.some(sub => pathname.startsWith(sub.url))
    );
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups(prev => [...prev, activeGroup.title]);
    }
  }, [pathname]);

  const handleLogout = () => {
    dispatch(logoutStart());
  };

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'Admin User';
  const displayEmail = user?.email || 'admin@school.edu';
  const initials = user?.first_name ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'AU';
  const schoolName = school?.name || 'Pallisa High School';

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm">
            <School className="h-5 w-5" />
          </div>
          {state !== 'collapsed' && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">{schoolName}</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-none">Management</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4 scrollbar-none">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const hasSubItems = !!item.items;
              const isGroupOpen = openGroups.includes(item.title);
              const isGroupActive = item.items?.some(sub => pathname.startsWith(sub.url)) || pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  {hasSubItems ? (
                    <div className="flex flex-col">
                      <SidebarMenuButton 
                        tooltip={item.title}
                        isActive={isGroupActive}
                        onClick={() => toggleGroup(item.title)}
                        className={cn(
                          "transition-all duration-200 rounded-lg",
                          isGroupActive ? "bg-[#0369a1] text-white font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isGroupActive ? "text-white" : "text-gray-400")} />
                        <span>{item.title}</span>
                        <ChevronRight className={cn(
                          "ml-auto h-3.5 w-3.5 transition-transform duration-200",
                          isGroupOpen ? "rotate-90" : ""
                        )} />
                      </SidebarMenuButton>
                      {isGroupOpen && (
                        <SidebarMenuSub className="mt-1 ml-4 border-l-2 border-gray-100">
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link 
                                  href={subItem.url}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs transition-colors",
                                    pathname === subItem.url 
                                      ? "text-[#0369a1] font-bold bg-sky-50" 
                                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </div>
                  ) : (
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title} 
                      isActive={pathname === item.url}
                      className={cn(
                        "transition-all duration-200 rounded-lg",
                        pathname === item.url ? "bg-[#0369a1] text-white font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn("h-4 w-4", pathname === item.url ? "text-white" : "text-gray-400")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarMenu>
            {quickActions.map((action) => (
              <SidebarMenuItem key={action.title}>
                <SidebarMenuButton asChild tooltip={action.title} className="text-gray-600 hover:bg-blue-50/50 group">
                  <Link href={action.url}>
                    <PlusCircle className={cn("h-4 w-4 transition-transform group-hover:scale-110", action.color)} />
                    <span className="group-hover:text-gray-900">{action.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-gray-100 bg-gray-50/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white data-[state=open]:shadow-sm rounded-xl transition-all"
            >
              <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-white">
                <AvatarImage src={user?.profile_picture || ""} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {state !== 'collapsed' && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-bold text-gray-900">{displayName}</span>
                    <span className="truncate text-[10px] text-gray-500 font-medium">{displayEmail}</span>
                  </div>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-2 shadow-xl border-gray-100"
            side={state === 'collapsed' ? 'right' : 'top'}
            align="end"
            sideOffset={12}
          >
            <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-gray-50 rounded-lg">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage src={user?.profile_picture || ""} alt={displayName} />
                <AvatarFallback className="rounded-lg bg-primary text-white font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-gray-900">{displayName}</span>
                <span className="truncate text-[11px] text-gray-500">{displayEmail}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white" />
            <DropdownMenuItem className="rounded-lg py-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
              <User className="mr-3 h-4 w-4" />
              <span className="font-medium">My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg py-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
              <Settings className="mr-3 h-4 w-4" />
              <span className="font-medium">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-lg py-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-bold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
