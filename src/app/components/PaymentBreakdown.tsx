import React from 'react';
import { Card } from '@/app/components/ui/card';

interface PaymentBreakdownProps {
  amount: number; // in cents
  currency?: string;
  commissionPercentage?: number;
  platformCommission?: number;
  specialistEarnings?: number;
  showSpecialistBreakdown?: boolean;
}

export const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  amount,
  currency = 'USD',
  commissionPercentage = 15,
  platformCommission = Math.round(amount * (commissionPercentage / 100)),
  specialistEarnings = amount - platformCommission,
  showSpecialistBreakdown = true,
}) => {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="text-sm font-semibold text-gray-700">Payment Breakdown</div>

        {/* Course Price */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">Course Price</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(amount)}
          </span>
        </div>

        {/* Platform Commission */}
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">
            Platform Commission ({commissionPercentage}%)
          </span>
          <span className="text-red-600 font-semibold">
            -{formatCurrency(platformCommission)}
          </span>
        </div>

        {/* Specialist Earnings (if requested) */}
        {showSpecialistBreakdown && (
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-gray-700 font-semibold">Specialist Receives</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(specialistEarnings)}
            </span>
          </div>
        )}

        {/* Total You Pay */}
        <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 border border-gray-200">
          <span className="font-semibold text-gray-900">Total You Pay</span>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(amount)}
          </span>
        </div>

        {/* Info text */}
        <div className="text-xs text-gray-500 pt-2">
          💡 Platform commission helps us maintain and improve the service
        </div>
      </div>
    </Card>
  );
};

export default PaymentBreakdown;
