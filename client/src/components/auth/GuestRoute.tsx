"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/hooks/usePermissions';

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * GuestRoute component that redirects authenticated users away from the page.
 * Useful for login and registration pages.
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  // If authenticated, don't render children to avoid flash of content
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
