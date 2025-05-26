'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { DocumentArrowDownIcon, GlobeAltIcon, ChartBarIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import { SelectDropdown } from '@/components/SelectDropdown';
import StatsCard from '@/components/StatsCard';

// Local type for dashboard options
type DashboardOption = {
  id: string;
  label: string;
  value: string;
};

// Define types for our data
interface ESGData {
  id: string;
  companyName: string;
  submittedAt: { seconds: number; nanoseconds: number } | Timestamp;
  carbonFootprint: number;
  waterUsage: number;
  [key: string]: any;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
}

interface Option {
  value: string | null;
  label: string;
  id: string;
}

// Utility functions
const formatNumber = (num: number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const formatPercent = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(num / 100);
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const DEFAULT_DATE_RANGE = 12;

interface DateRange {
  start: Date;
  end: Date;
}

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Something went wrong while loading the dashboard. Please try refreshing the page.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [esgData, setEsgData] = useState<ESGData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(subMonths(new Date(), DEFAULT_DATE_RANGE - 1)),
    end: endOfMonth(new Date())
  });
  const [selectedCompany, setSelectedCompany] = useState<DashboardOption | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<DashboardOption | null>(null);

  // Helper function to convert SelectDropdown.Option to DashboardOption
  const toDashboardOption = (option: { id: string | number; label: string; value: unknown } | null): DashboardOption | null => {
    if (!option) return null;
    return {
      id: String(option.id),
      label: option.label,
      value: String(option.value)
    };
  };

  const [activeTab, setActiveTab] = useState('overview');

  // Handle date range change
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    try {
      if (startDate && endDate) {
        // Ensure dates are valid Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          setDateRange({ start, end });
        } else {
          console.error('Invalid date range selected');
        }
      }
    } catch (error) {
      console.error('Error handling date range change:', error);
    }
  };

  // Fetch ESG data
  const fetchESGData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // In a real app, you would fetch data from Firestore with proper filtering
      // This is a simplified example
      const q = query(
        collection(db, 'esgData'),
        where('userId', '==', user.uid),
        orderBy('submittedAt', 'desc'),
        limit(1000)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ESGData[];
      
      setEsgData(data);
      
      // For demo purposes, generate some mock companies if none exist
      if (companies.length === 0) {
        const mockCompanies: Company[] = [
          { id: '1', name: 'Acme Corp', industry: 'Manufacturing', employees: 1250 },
          { id: '2', name: 'Globex', industry: 'Technology', employees: 8500 },
          { id: '3', name: 'Initech', industry: 'Finance', employees: 320 },
        ];
        setCompanies(mockCompanies);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, companies.length]);

  // Load data on component mount
  useEffect(() => {
    fetchESGData();
  }, [fetchESGData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Filter data based on selected filters
  const filteredData = esgData.filter((item) => {
    if (!item.submittedAt) return false;
    
    // Convert Firestore Timestamp to Date if needed
    const submittedAt = item.submittedAt instanceof Timestamp 
      ? item.submittedAt.toDate() 
      : new Date(item.submittedAt.seconds * 1000);
    
    // Filter by date range
    const matchesDate = submittedAt >= dateRange.start && submittedAt <= dateRange.end;
    
    // Filter by company
    const companyMatch = !selectedCompany?.value || item.companyName === selectedCompany.value;
    
    // Filter by status
    const statusMatch = !selectedStatus?.value || item.verificationStatus === selectedStatus.value;
    
    return matchesDate && companyMatch && statusMatch;
  });

  // Group data by year for charts
  const yearlyData = filteredData.reduce<Record<string, ESGData[]>>((acc, item) => {
    if (!item.submittedAt) return acc;
    
    const submittedAt = item.submittedAt instanceof Timestamp 
      ? item.submittedAt.toDate() 
      : new Date(item.submittedAt.seconds * 1000);
      
    const year = submittedAt.getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {});

  // Prepare data for line charts
  const chartData = Object.entries(yearlyData)
    .map(([year, items]) => ({
      year: parseInt(year),
      carbonFootprint: items.reduce((sum, item) => sum + (item.carbonFootprint || 0), 0) / items.length,
      waterUsage: items.reduce((sum, item) => sum + (item.waterUsage || 0), 0) / items.length,
    }))
    .sort((a, b) => a.year - b.year);

  // Group data by month for trends
  const monthlyMetrics = filteredData.reduce<Array<{
    month: string;
    carbonFootprint: number;
    waterUsage: number;
  }>>((acc, item) => {
    if (!item.submittedAt) return acc;
    
    const date = item.submittedAt instanceof Timestamp 
      ? item.submittedAt.toDate() 
      : new Date(item.submittedAt.seconds * 1000);
      
    const month = format(date, 'MMM yyyy');
    const existingMonth = acc.find(m => m.month === month);
    
    if (existingMonth) {
      existingMonth.carbonFootprint += item.carbonFootprint || 0;
      existingMonth.waterUsage += item.waterUsage || 0;
    } else {
      acc.push({
        month,
        carbonFootprint: item.carbonFootprint || 0,
        waterUsage: item.waterUsage || 0,
      });
    }
    
    return acc;
  }, []);

  // Calculate verification status counts
  const verificationStatusCount = filteredData.reduce<Record<string, number>>((acc, item) => {
    acc[item.verificationStatus] = (acc[item.verificationStatus] || 0) + 1;
    return acc;
  }, {});

  // Calculate statistics
  const { totalCarbon, totalWater, totalWaste, totalRenewable } = filteredData.reduce(
    (sum, item) => ({
      totalCarbon: sum.totalCarbon + (item.carbonFootprint || 0),
      totalWater: sum.totalWater + (item.waterUsage || 0),
      totalWaste: sum.totalWaste + (item.wasteGenerated || 0),
      totalRenewable: sum.totalRenewable + (item.renewableEnergy || 0),
      count: sum.count + 1,
    }),
    { totalCarbon: 0, totalWater: 0, totalWaste: 0, totalRenewable: 0, count: 0 }
  );

  const averageCarbonFootprint = filteredData.length > 0
    ? filteredData.reduce((sum: number, item) => sum + (item.carbonFootprint || 0), 0) / filteredData.length
    : 0;

  const averageWaterUsage = filteredData.length > 0
    ? filteredData.reduce((sum: number, item) => sum + (item.waterUsage || 0), 0) / filteredData.length
    : 0;

  // Calculate changes from previous period
  const prevPeriodEnd = subMonths(dateRange.start, 1);
  const prevPeriodStart = subMonths(prevPeriodEnd, (
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  ));
  
  const prevPeriodData = esgData.filter(item => {
    if (!item.submittedAt) return false;
    
    const submittedAt = item.submittedAt instanceof Timestamp 
      ? item.submittedAt.toDate() 
      : new Date(item.submittedAt.seconds * 1000);
      
    return submittedAt >= prevPeriodStart && submittedAt <= prevPeriodEnd;
  });
  
  const prevTotalCarbon = prevPeriodData.reduce((sum, item) => sum + (item.carbonFootprint || 0), 0);
  const prevTotalWater = prevPeriodData.reduce((sum, item) => sum + (item.waterUsage || 0), 0);
  
  const carbonChange = calculateChange(averageCarbonFootprint, prevTotalCarbon / prevPeriodData.length);
  const waterChange = calculateChange(averageWaterUsage, prevTotalWater / prevPeriodData.length);

  // Calculate verification rate
  const verifiedCount = filteredData.filter(item => item.verificationStatus === 'Verified').length;
  const verificationRate = filteredData.length > 0 ? (verifiedCount / filteredData.length) * 100 : 0;

  // Get unique companies and statuses for filters
  const companyOptions: DashboardOption[] = Array.from(new Set(esgData.map(item => item.companyName)))
    .filter((company): company is string => Boolean(company))
    .map(company => ({
      id: company.toLowerCase().replace(/\s+/g, '-'),
      label: company,
      value: company
    }));

  const statusOptions: DashboardOption[] = [
    { id: 'all', label: 'All Statuses', value: '' },
    { id: 'approved', label: 'Approved', value: 'Approved' },
    { id: 'pending', label: 'Pending', value: 'Pending' },
    { id: 'rejected', label: 'Rejected', value: 'Rejected' },
    { id: 'verified', label: 'Verified', value: 'Verified' },
  ];

  // Handle export
  const handleExport = (exportFormat: 'csv' | 'json') => {
    const data = filteredData.map(item => {
      const submittedAt = item.submittedAt instanceof Timestamp 
        ? item.submittedAt.toDate() 
        : new Date(item.submittedAt.seconds * 1000);
      
      return {
        ...item,
        submittedAt: format(submittedAt, 'yyyy-MM-dd')
      };
    });
    
    if (exportFormat === 'csv') {
      // Convert to CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(row => 
        Object.values(row).map(field => 
          typeof field === 'string' ? `"${field.replace(/"/g, '""')}"` : String(field)
        ).join(',')
      );
      
      const csv = [headers, ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `esg-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `esg-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">ESG Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1">
                <DateRangePicker
                  onDateRangeChange={handleDateRangeChange}
                  initialRange={{
                    start: dateRange.start,
                    end: dateRange.end
                  }}
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:col-span-2">
                <SelectDropdown
                  options={[
                    { id: 'all', label: 'All Companies', value: '' },
                    ...companyOptions
                  ]}
                  selected={selectedCompany}
                  onChange={(option) => setSelectedCompany(toDashboardOption(option))}
                  placeholder="Select Company"
                  label="Company"
                  className="w-full"
                />
                <SelectDropdown
                  options={statusOptions}
                  selected={selectedStatus}
                  onChange={(option) => setSelectedStatus(toDashboardOption(option))}
                  placeholder="Select Status"
                  label="Status"
                  className="w-full"
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:col-span-1 flex items-end justify-end space-x-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatsCard
              title="Total Submissions"
              value={filteredData.length.toString()}
              icon={ChartBarIcon}
              change={{
                value: '0.0%',
                isPositive: true,
                label: 'vs last period'
              }}
            />
            <StatsCard
              title="Average Carbon Footprint"
              value={`${averageCarbonFootprint.toFixed(2)} tCO2e`}
              icon={GlobeAltIcon}
              change={{
                value: carbonChange >= 0 ? `${carbonChange.toFixed(1)}%` : `${Math.abs(carbonChange).toFixed(1)}%`,
                isPositive: carbonChange >= 0,
                label: 'vs last period'
              }}
            />
            <StatsCard
              title="Average Water Usage"
              value={`${averageWaterUsage.toFixed(2)} m³`}
              icon={UsersIcon}
              change={{
                value: waterChange >= 0 ? `${waterChange.toFixed(1)}%` : `${Math.abs(waterChange).toFixed(1)}%`,
                isPositive: waterChange >= 0,
                label: 'vs last period'
              }}
            />
            <StatsCard
              title="Verification Rate"
              value={`${verificationRate.toFixed(1)}%`}
              icon={ClockIcon}
              change={{
                value: 'N/A',
                isPositive: true,
                label: 'No previous data'
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Verification Status</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(verificationStatusCount).map(([name, value]) => ({
                        name,
                        value,
                        fill: name === 'Verified' ? '#10b981' : name === 'Pending' ? '#f59e0b' : '#ef4444'
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {Object.entries(verificationStatusCount).map(([name], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={name === 'Verified' ? '#10b981' : name === 'Pending' ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Top Companies by Carbon Footprint</h2>
              <div className="h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carbon Footprint</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData
                      .sort((a, b) => (b.carbonFootprint || 0) - (a.carbonFootprint || 0))
                      .slice(0, 5)
                      .map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.carbonFootprint?.toFixed(2) || 'N/A'} tCO2e
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
