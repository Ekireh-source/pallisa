'use client';

import { Bell, User, LogOut, Settings, Menu } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import { logoutStart } from "@/store/auth/actions";
import { useIsMobile } from "@/hooks/use-mobile";

interface SharedNavbarProps {
  userName?: string;
  userEmail?: string;
  isSideBarOpen?: boolean;
  setIsSideBarOpen?: (value: boolean) => void;
}

export function SharedNavbar({
  userName = "Admin User",
  userEmail = "admin@school.edu",
  isSideBarOpen,
  setIsSideBarOpen
}: SharedNavbarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user: userState } = useSelector((state: RootState) => state.auth);
  const user = userState.value;
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    if (setIsSideBarOpen && isSideBarOpen !== undefined) {
      setIsSideBarOpen(!isSideBarOpen);
    }
  };

  const handleLogout = () => {
    dispatch(logoutStart());
    router.push('/login');
  };

  const getInitials = (name: string) => {
    if (!name || name === "Admin User") return "AU";
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user ? `${user.first_name} ${user.last_name}` : userName;
  const displayEmail = user?.email || userEmail;

  return (
    <header className="sticky top-0 z-50 flex h-[52px] md:h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-gray-100 bg-white px-4">
      <div className="flex items-center gap-2">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white ">
          <span className="font-bold text-sm">P</span>
        </div>

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="mobile-menu-button"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5 text-My-Black" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}

        <h1 className="text-base md:text-lg font-semibold text-My-Black ml-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Caskool
          </Link>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
                <AvatarFallback className="bg-gray-100 text-My-Black text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 