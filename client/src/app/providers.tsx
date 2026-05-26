'use client';

import { ReduxProvider } from '@/providers/redux-provider';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#0fa88a"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #0fa88a,0 0 5px #0fa88a"
        zIndex={1600}
      />
      <ReduxProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ReduxProvider>
    </>
  );
}
