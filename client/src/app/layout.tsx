'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Pallisa High School Management System</title>
        <meta name="description" content="Complete management solution for Pallisa High School - Teachers, Students, Parents & Academic Records" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider store={store}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
