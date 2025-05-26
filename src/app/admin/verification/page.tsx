'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { getFirebaseServices } from '@/utils/firebaseConfig';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Submission {
  id: string;
  companyName: string;
  reportingYear: number;
  carbonFootprint: number;
  waterUsage: number;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;
  submittedAt: any;
  userId: string;
}

export default function VerificationPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Get Firebase services
  const { db } = getFirebaseServices();

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    if (!db) {
      console.error('Firestore database is not initialized.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let q = query(collection(db, 'esgData'));
      
      if (filter !== 'all') {
        q = query(q, where('verificationStatus', '==', filter === 'pending' ? 'Pending' : 
          filter === 'approved' ? 'Approved' : 'Rejected'));
      }
      
      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];
      
      // Sort by submission date (newest first)
      submissionsData.sort((a, b) => b.submittedAt?.seconds - a.submittedAt?.seconds);
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!db) {
      console.error('Firestore database is not initialized.');
      alert('Failed to update status. Database not available.');
      setUpdating(null);
      return;
    }
    try {
      setUpdating(id);
      await updateDoc(doc(db, 'esgData', id), {
        verificationStatus: status,
        verifiedAt: new Date().toISOString(),
      });
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === id ? { ...sub, verificationStatus: status } : sub
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'Approved':
        return (
          <span className={`${baseStyles} bg-green-100 text-green-800`}>
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className={`${baseStyles} bg-red-100 text-red-800`}>
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseStyles} bg-yellow-100 text-yellow-800`}>
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">ESG Data Verification</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and verify ESG data submissions from companies.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'approved' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'rejected' 
                  ? 'bg-red-100 text-red-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Company
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reporting Year
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Carbon Footprint (tons)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Water Usage (m³)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Submitted
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {submissions.length > 0 ? (
                    submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {submission.companyName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {submission.reportingYear}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {submission.carbonFootprint.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {submission.waterUsage.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getStatusBadge(submission.verificationStatus)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(submission.submittedAt)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {submission.verificationStatus === 'Pending' ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateStatus(submission.id, 'Approved')}
                                disabled={updating === submission.id}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Approve"
                              >
                                {updating === submission.id ? (
                                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                  <CheckCircleIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => updateStatus(submission.id, 'Rejected')}
                                disabled={updating === submission.id}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => fetchSubmissions()}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Refresh"
                            >
                              <ArrowPathIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No submissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
