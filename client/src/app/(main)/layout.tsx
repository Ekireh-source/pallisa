'use client';

import React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SharedNavbar } from '@/components/layout/SharedNavbar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <SharedNavbar />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 