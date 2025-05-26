'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Query, QueryDocumentSnapshot, DocumentData, Firestore } from 'firebase/firestore';
import { db } from '@/utils/firebaseConfig';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Error boundary component with retry functionality
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md bg-red-50 p-6 max-w-2xl mx-auto mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Failed to load the dashboard. {this.state.error?.message}</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

const StatsCard = ({ title, value, icon: Icon, trend }: StatsCardProps) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isUp ? '↑' : '↓'} {trend.value}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

function AdminDashboardContent() {
  interface DashboardStats {
    totalUsers: number;
    pendingVerifications: number;
    totalSubmissions: number;
    activeUsers: number;
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    totalSubmissions: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser, isAdmin, isLoading: authLoading } = useAuth();

  // Debug logging
  console.log('Dashboard - Auth State:', {
    currentUser: !!currentUser,
    isAdmin,
    authLoading,
    hasDb: !!db
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      console.log('No user found, redirecting to login');
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Show unauthorized message if not admin
  if (!authLoading && currentUser && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-400" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-gray-600">
              You don't have permission to access the admin dashboard.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Home
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              If you believe this is a mistake, please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  // Show error if Firebase services aren't available
  if (!db) {
    return (
      <div className="rounded-md bg-red-50 p-6 max-w-2xl mx-auto mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">Firebase Services Unavailable</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Unable to connect to Firebase services. Please check your internet connection and refresh the page.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Show error message if there's an error
  if (error) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Unable to load dashboard data</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Only fetch stats if user is authenticated and is admin
    if (!currentUser || !isAdmin) {
      console.log('Skipping stats fetch - user not authenticated or not admin');
      return () => {}; // Return empty cleanup function
    }
    
    console.log('Dashboard: Starting to fetch stats...');
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Dashboard: Checking Firebase DB...');
        if (!db) {
          console.error('Firebase DB is not initialized');
          throw new Error('Firebase is not initialized');
        }

        // Type the queries
        const usersQuery: Query<DocumentData> = collection(db, 'users');
        const submissionsQuery: Query<DocumentData> = collection(db, 'esgData');
        const pendingQuery: Query<DocumentData> = query(
          collection(db, 'esgData'), 
          where('verificationStatus', '==', 'Pending')
        );

        // Execute queries in parallel
        console.log('Dashboard: Executing Firestore queries...');
        const [usersSnapshot, submissionsSnapshot, pendingSnapshot] = await Promise.all([
          getDocs(usersQuery).catch(err => {
            console.error('Error fetching users:', err);
            throw err;
          }),
          getDocs(submissionsQuery).catch(err => {
            console.error('Error fetching submissions:', err);
            throw err;
          }),
          getDocs(pendingQuery).catch(err => {
            console.error('Error fetching pending verifications:', err);
            throw err;
          }),
        ]);

        setStats({
          totalUsers: usersSnapshot.size,
          totalSubmissions: submissionsSnapshot.size,
          pendingVerifications: pendingSnapshot.size,
          activeUsers: Math.floor(usersSnapshot.size * 0.65),
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats().catch(err => {
      console.error('Error in fetchStats:', err);
      setError('Failed to load dashboard data. See console for details.');
      setLoading(false);
    });
  }, [db, router]);
  
  console.log('Dashboard render - loading:', loading, 'error:', error);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Dashboard Overview</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Welcome to the admin dashboard. Here you can manage users, verify submissions, and view platform analytics.
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={UserGroupIcon}
            trend={{ value: '12%', isUp: true }}
          />
          <StatsCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={DocumentCheckIcon}
            trend={{ value: '5%', isUp: false }}
          />
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={ChartBarIcon}
            trend={{ value: '24%', isUp: true }}
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            icon={ClockIcon}
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest actions and events on the platform.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recent Sign-ups</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalUsers > 0 ? `${stats.totalUsers} total users` : 'No users found'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Pending Actions</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.pendingVerifications > 0 
                  ? `${stats.pendingVerifications} submissions need verification` 
                  : 'No pending actions'}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}

// Add display name for better debugging
DashboardPage.displayName = 'DashboardPage';
