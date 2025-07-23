'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { restoreAuthFromTokens, logoutUser } from '@/store/slices/authSlice';
import { setLogoutHandler } from '@/lib/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Register logout handler for API interceptor
    const handleLogout = () => {
      dispatch(logoutUser());
      router.push('/login');
    };
    setLogoutHandler(handleLogout);

    // Attempt to restore authentication from stored tokens on app initialization
    const initializeAuth = async () => {
      try {
        await dispatch(restoreAuthFromTokens());
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch, router]);

  // Show loading spinner only during initial authentication check
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 