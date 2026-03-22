import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Payout {
  id: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'on_hold' | 'rejected';
  failureReason: string | null;
  payoutCompletedAt: string | null;
  createdAt: string;
}

interface PayoutStats {
  thisMonth: {
    enrollments: number;
    totalEarnings: number;
    totalCompleted: number;
    totalPending: number;
  };
  allTime: {
    totalEarnings: number;
    totalCommissionPaid: number;
    lastPayoutDate: string | null;
  };
  bankAccountStatus: {
    isSetup: boolean;
    isVerified: boolean;
    verificationStatus: string;
  };
}

export const PayoutHistory: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || '/api';
        const authToken = localStorage.getItem('authToken');

        // Fetch stats
        const statsResponse = await fetch(`${apiBaseUrl}/specialist/payout-stats`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // Fetch payouts
        let url = `${apiBaseUrl}/specialist/payouts?limit=20&skip=0`;
        if (filterStatus) {
          url += `&status=${filterStatus}`;
        }

        const payoutsResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        const payoutsData = await payoutsResponse.json();
        if (payoutsData.success) {
          setPayouts(payoutsData.payouts);
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load payout data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-900">₹{stats.thisMonth.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">{stats.thisMonth.enrollments} enrollments</p>
          </div>

          {/* Completed This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Paid This Month</p>
            <p className="text-2xl font-bold text-green-600">₹{stats.thisMonth.totalCompleted.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Successfully transferred</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Payouts</p>
            <p className="text-2xl font-bold text-yellow-600">₹{stats.thisMonth.totalPending.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting processing</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-gray-900" />
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{stats.allTime.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>
        </div>
      )}

      {/* Bank Account Status */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Setup Status</p>
              <div className="mt-2 flex items-center gap-2">
                {stats.bankAccountStatus.isSetup ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">Configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-600">Not Setup</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <p className="text-sm font-semibold text-gray-900 mt-2 capitalize">
                {stats.bankAccountStatus.verificationStatus}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Auto Payouts</p>
              <p className="text-sm font-semibold text-gray-900 mt-2">
                {stats.bankAccountStatus.isSetup && stats.bankAccountStatus.isVerified ? (
                  <span className="text-green-600">✓ Enabled</span>
                ) : (
                  <span className="text-yellow-600">Pending Setup</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === ''
              ? 'bg-gray-900 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('failed')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Failed
        </button>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Course</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No payouts yet
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{payout.courseTitle}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{payout.amount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)}
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </div>
                    {payout.failureReason && (
                      <p className="text-xs text-red-600 mt-1">{payout.failureReason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">
                      {payout.payoutCompletedAt
                        ? new Date(payout.payoutCompletedAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutHistory;
