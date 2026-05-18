'use client';

import { ReduxProvider } from '@/providers/redux-provider';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ReduxProvider>
  );
}
