'use client';

import { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SubmitEsgPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [reportingYear, setReportingYear] = useState<number | ''>('');
  const [carbonFootprint, setCarbonFootprint] = useState<number | ''>('');
  const [waterUsage, setWaterUsage] = useState<number | ''>('');
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not loading and no user is authenticated
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]); // Dependencies for the effect

  if (loading) {
    return <p className="text-center text-gray-500">Loading user data...</p>;
  }

  // If there's no user, and we haven't redirected yet (or still loading), 
  // it's good practice to return null or a minimal loading/redirecting indicator 
  // to prevent rendering the form momentarily.
  if (!user) {
    return <p className="text-center text-gray-500">Redirecting to login...</p>; 
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Basic validation
    if (!companyName || reportingYear === '' || carbonFootprint === '' || waterUsage === '') {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      setError('User not authenticated');
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'esgData'), {
        userId: user.uid,
        companyName,
        reportingYear: Number(reportingYear),
        carbonFootprint: Number(carbonFootprint),
        waterUsage: Number(waterUsage),
        verificationStatus,
        timestamp: serverTimestamp(),
      });
      setSuccess('ESG data submitted successfully!');
      setCompanyName('');
      setReportingYear('');
      setCarbonFootprint('');
      setWaterUsage('');
      setVerificationStatus('Pending');
    } catch (err: any) {
      console.error('Error submitting ESG data:', err);
      setError(err.message || 'Failed to submit ESG data. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Submit ESG Data
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reportingYear" className="block text-sm font-medium text-gray-700">
                Reporting Year
              </label>
              <div className="mt-1">
                <input
                  id="reportingYear"
                  name="reportingYear"
                  type="number"
                  required
                  value={reportingYear}
                  onChange={(e) => setReportingYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="carbonFootprint" className="block text-sm font-medium text-gray-700">
                Carbon Footprint (tons CO2e)
              </label>
              <div className="mt-1">
                <input
                  id="carbonFootprint"
                  name="carbonFootprint"
                  type="number"
                  required
                  value={carbonFootprint}
                  onChange={(e) => setCarbonFootprint(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="waterUsage" className="block text-sm font-medium text-gray-700">
                Water Usage (cubic meters)
              </label>
              <div className="mt-1">
                <input
                  id="waterUsage"
                  name="waterUsage"
                  type="number"
                  required
                  value={waterUsage}
                  onChange={(e) => setWaterUsage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="verificationStatus" className="block text-sm font-medium text-gray-700">
                Verification Status
              </label>
              <div className="mt-1">
                <select
                  id="verificationStatus"
                  name="verificationStatus"
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option>Pending</option>
                  <option>Verified</option>
                  <option>Unverified</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Data'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}