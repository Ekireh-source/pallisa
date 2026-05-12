'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { logoutStart } from '@/store/auth/actions';

import { SharedNavbar } from '@/components/layout/SharedNavbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, school, user } = useSelector((state: RootState) => state.auth);

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAllowedPath = pathname === '/school/create' || pathname.startsWith('/campuses');

  useEffect(() => {
    if (!mounted) return;

    // 1. If no access token, redirect to login
    if (!accessToken) {
      router.push('/login');
      return;
    }

    // 2. If authenticated but no school data, redirect to school creation
    if (!school && !isAllowedPath) {
      router.push('/school/create');
    }
  }, [accessToken, school, isAllowedPath, router, mounted]);

  // Prevent hydration mismatch by not rendering anything until mounted on the client
  if (!mounted) {
    return null;
  }

  // Don't render layout if not authenticated (after mounting)
  if (!accessToken) {
    return null;
  }

  // If authenticated but no school, only allow rendering allowed paths
  if (!school && !isAllowedPath) {
    return null;
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <SharedNavbar />
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}