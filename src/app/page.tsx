'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link'; // Make sure to import Link

export default function HomePage() {
  const { user, loading, logout, isAdmin } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
        <p className="text-center text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">ESG Management Platform</h1>
      </div>

      <div className="relative flex place-items-center my-16">
        <h1 className="text-5xl font-bold text-gray-800">Welcome to ESG Platform</h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-3 lg:text-left gap-8">
        {user ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="mb-3 text-2xl font-semibold text-gray-700">
                Hello, {user.email}!
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-75">
                You are logged in. You can now manage your ESG data.
              </p>
              <div className="space-x-4">
                <Link href="/dashboard" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  View Dashboard
                </Link>
                <Link href="/submit-esg" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                  Submit ESG Data
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin/dashboard" 
                    className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
              <button
                onClick={logout}
                className="mt-4 ml-4 inline-block px-4 py-2 text-sm font-medium text-indigo-600 bg-transparent border border-indigo-600 rounded-md hover:bg-indigo-50"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="mb-3 text-2xl font-semibold text-gray-700">
                Get Started
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-75">
                Please log in or sign up to manage and submit your ESG data.
              </p>
              <Link href="/auth" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Login / Sign Up
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
