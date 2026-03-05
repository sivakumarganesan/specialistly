import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

interface BankAccount {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  bankName: string;
  isVerified: boolean;
  verificationStatus: string;
  verificationDate: string | null;
  addedAt: string;
}

export const SpecialistBankSetup: React.FC = () => {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'savings',
    bankName: '',
  });

  // Fetch current bank account
  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5001/api';
        const response = await fetch(`${apiBaseUrl}/specialist/bank-account`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        const data = await response.json();
        if (data.success && data.bankAccount) {
          setBankAccount(data.bankAccount);
          setFormData({
            accountHolderName: data.bankAccount.accountHolderName || '',
            accountNumber: data.bankAccount.accountNumber || '',
            ifscCode: data.bankAccount.ifscCode || '',
            accountType: data.bankAccount.accountType || 'savings',
            bankName: data.bankAccount.bankName || '',
          });
        }
      } catch (err) {
        console.error('[BankSetup] Error fetching bank account:', err);
      }
    };

    fetchBankAccount();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Validation
      if (!formData.accountHolderName.trim()) {
        setError('Account holder name is required');
        setIsSaving(false);
        return;
      }

      if (!/^\d{8,18}$/.test(formData.accountNumber)) {
        setError('Invalid account number (8-18 digits)');
        setIsSaving(false);
        return;
      }

      if (!/^[A-Z0-9]{11}$/.test(formData.ifscCode)) {
        setError('Invalid IFSC code (11 characters)');
        setIsSaving(false);
        return;
      }

      if (!formData.bankName.trim()) {
        setError('Bank name is required');
        setIsSaving(false);
        return;
      }

      const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5001/api';
      const response = await fetch(`${apiBaseUrl}/specialist/bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to save bank details');
        setIsSaving(false);
        return;
      }

      setBankAccount(data.bankAccount);
      setSuccess('Bank account details saved successfully!');
      setIsEditing(false);
      setIsSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving bank account';
      setError(errorMsg);
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bank Account Details</h2>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Bank Account Status Info */}
        {bankAccount && !isEditing && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account Holder Name</p>
                <p className="text-lg font-semibold text-gray-900">{bankAccount.accountHolderName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="text-lg font-semibold text-gray-900">{bankAccount.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IFSC Code</p>
                <p className="text-lg font-semibold text-gray-900">{bankAccount.ifscCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bank Name</p>
                <p className="text-lg font-semibold text-gray-900">{bankAccount.bankName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Account Type</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900 capitalize">{bankAccount.accountType}</p>
                  {bankAccount.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name *
              </label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Enter your full name as on bank account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="8-18 digit account number"
                maxLength={18}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your account number will be securely encrypted</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="e.g., AXIS0000123"
                  maxLength={11}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="e.g., Axis Bank, HDFC Bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isSaving ? 'Saving...' : 'Save Bank Account'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Edit Button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {bankAccount ? 'Update Bank Account' : 'Add Bank Account'}
          </button>
        )}

        {/* Important Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Important:</strong> Your bank account details will be used to automatically transfer your course earnings. Make sure the information is accurate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpecialistBankSetup;
