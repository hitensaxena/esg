'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import setupErrorHandling from '@/utils/errorHandler';

// Using built-in font optimization with display=swap
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: true,
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
  adjustFontFallback: true,
});

// Helper component to set viewport meta tag
const ViewportMeta = () => (
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
);

// Initialize error handling on the client side
function ErrorHandlerInitializer() {
  useEffect(() => {
    setupErrorHandling();
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <title>ESG Dashboard</title>
        <meta name="description" content="Environmental, Social, and Governance Dashboard" />
        <ViewportMeta />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:title" content="ESG Dashboard" />
        <meta property="og:description" content="Environmental, Social, and Governance Dashboard" />
        <meta property="og:site_name" content="ESG Dashboard" />
        <meta property="og:locale" content="en_US" />
        
        {/* Let Next.js handle font optimization */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorHandlerInitializer />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
