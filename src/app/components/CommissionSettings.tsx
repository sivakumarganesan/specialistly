import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface CommissionRates {
  platform: number;
  byServiceType: {
    course: number;
    consulting: number;
    webinar: number;
  };
  isActive: boolean;
  minimumChargeAmount: number;
  effectiveDate: string;
}

interface CommissionStatsProps {
  onSaved?: () => void;
}

export const CommissionSettings: React.FC<CommissionStatsProps> = ({ onSaved }) => {
  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCommissionRates();
  }, []);

  const fetchCommissionRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/commission/rates`
      );
      const data = await response.json();
      if (data.success) {
        setRates(data.data);
      }
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      setMessage({
        type: 'error',
        text: 'Failed to fetch commission rates',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async (key: 'platform' | 'course' | 'consulting' | 'webinar', value: number) => {
    try {
      setSaving(true);

      let percentage = value;
      let serviceType = null;

      if (key === 'platform') {
        percentage = value;
      } else {
        serviceType = key;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/commission/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            percentage,
            serviceType,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Commission updated successfully`,
        });
        // Refresh rates
        await fetchCommissionRates();
        onSaved?.();
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to update commission',
        });
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update commission rate',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Global Commission Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Global Commission Rate</CardTitle>
          <CardDescription>
            Default platform commission applied to all services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-indigo-200">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold text-indigo-600">{rates?.platform || 0}</span>
              <span className="text-xl text-gray-600">%</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Platform takes {rates?.platform || 0}% of each transaction
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={rates?.platform || 15}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 100) {
                    handleUpdateRate('platform', value);
                  }
                }}
                disabled={saving}
                className="w-24"
                placeholder="0"
              />
              <span className="text-gray-600 self-center">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service-Specific Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Specific Rates</CardTitle>
          <CardDescription>
            Override commission rate for specific service types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Courses */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                📚 Courses
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  {rates?.byServiceType?.course || 15}
                </span>
                <span className="text-lg text-gray-600">%</span>
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={rates?.byServiceType?.course || 15}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 100) {
                    handleUpdateRate('course', value);
                  }
                }}
                disabled={saving}
                className="w-full"
                placeholder="15"
              />
            </div>

            {/* Consulting */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💼 Consulting
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  {rates?.byServiceType?.consulting || 20}
                </span>
                <span className="text-lg text-gray-600">%</span>
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={rates?.byServiceType?.consulting || 20}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 100) {
                    handleUpdateRate('consulting', value);
                  }
                }}
                disabled={saving}
                className="w-full"
                placeholder="20"
              />
            </div>

            {/* Webinars */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🎥 Webinars
              </label>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  {rates?.byServiceType?.webinar || 15}
                </span>
                <span className="text-lg text-gray-600">%</span>
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                defaultValue={rates?.byServiceType?.webinar || 15}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 100) {
                    handleUpdateRate('webinar', value);
                  }
                }}
                disabled={saving}
                className="w-full"
                placeholder="15"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">How Commission Works</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>• Platform commission is deducted from each transaction</li>
            <li>• Specialists receive the remaining amount</li>
            <li>• Commission is displayed to customers before payment</li>
            <li>• Different service types can have different rates</li>
            <li>• Changes take effect immediately</li>
          </ul>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {rates?.effectiveDate && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date(rates.effectiveDate).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default CommissionSettings;
