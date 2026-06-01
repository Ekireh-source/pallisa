'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logoutStart } from '@/store/auth/actions';

import { SharedNavbar } from '@/components/layout/SharedNavbar';
import DashboardSideBar from '@/components/navigation/dashboard-sidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { school, user } = useSelector((state: RootState) => state.auth);

  const [mounted, setMounted] = React.useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = React.useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAllowedPath = pathname === '/school/create' || pathname.startsWith('/campuses');

  useEffect(() => {
    if (!mounted) return;

    // 1. If no authenticated user, redirect to login
    if (!user.value) {
      router.push('/login');
      return;
    }

    // 2. If authenticated but no school data, redirect to school creation
    if (!school && !isAllowedPath) {
      router.push('/school/create');
    }
  }, [user.value, school, isAllowedPath, router, mounted]);

  const isTeacherUser = !!(user?.value?.user?.is_teacher || user?.value?.is_teacher);
  const isDashboardPage = pathname === '/dashboard' || pathname === '/';

  // Prevent hydration mismatch by not rendering anything until mounted on the client
  if (!mounted) {
    return null;
  }

  // Don't render layout if not authenticated (after mounting)
  if (!user.value) {
    return null;
  }

  // If authenticated but no school, only allow rendering allowed paths
  if (!school && !isAllowedPath) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50/50 w-full overflow-hidden">
      {!isTeacherUser && (
        <DashboardSideBar isSideBarOpen={isSideBarOpen} setIsSideBarOpen={setIsSideBarOpen} />
      )}

      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${
          isMobile || isTeacherUser ? 'pl-0 pb-[72px]' : isSideBarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        {(!isTeacherUser || !isDashboardPage) && (
          <SharedNavbar isSideBarOpen={isSideBarOpen} setIsSideBarOpen={setIsSideBarOpen} />
        )}

        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
      
      <MobileBottomNav onMoreClick={() => setIsSideBarOpen(true)} />
    </div>
  );
}