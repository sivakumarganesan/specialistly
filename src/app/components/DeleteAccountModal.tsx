import { useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

export function DeleteAccountModal({ isOpen, onClose, onDeleteSuccess }: DeleteAccountModalProps) {
  const { user, logout } = useAuth();
  const [step, setStep] = useState<'confirm' | 'warning' | 'deleting'>('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleDelete = async () => {
    try {
      if (confirmText !== 'DELETE MY ACCOUNT') {
        setError('Please type "DELETE MY ACCOUNT" to confirm deletion');
        return;
      }

      setIsDeleting(true);
      setStep('deleting');
      setError('');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('✓ Account deleted successfully. Logging you out...');
        // Clear auth data and logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        logout();
        onDeleteSuccess();
      } else {
        setError(data.message || 'Failed to delete account');
        setStep('warning');
        setIsDeleting(false);
      }
    } catch (error: any) {
      console.error('[DeleteAccountModal] Error:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
      setStep('warning');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Confirm Step */}
        {step === 'confirm' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
              </div>
              <p className="text-gray-600 text-sm">
                This action cannot be undone. Please read the information below carefully.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">⚠️ What will be deleted:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {user?.isSpecialist ? (
                    <>
                      <li>• All your courses</li>
                      <li>• All your services & offerings</li>
                      <li>• All consulting slots</li>
                      <li>• Your creator profile</li>
                      <li>• Your Stripe account connection</li>
                      <li>• All customer enrollments in your courses</li>
                    </>
                  ) : (
                    <>
                      <li>• Your customer profile</li>
                      <li>• All course enrollments</li>
                      <li>• Your learning progress</li>
                      <li>• All bookings & appointments</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    onClose();
                    setStep('confirm');
                    setConfirmText('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('warning')}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Warning Step */}
        {step === 'warning' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-red-600">Confirm Deletion</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-semibold">
                Type the following text to confirm deletion:
              </p>

              <div className="bg-gray-100 p-3 rounded font-mono text-sm text-gray-700">
                DELETE MY ACCOUNT
              </div>

              <input
                type="text"
                placeholder="Type the text above"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-red-600"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setStep('confirm');
                    setConfirmText('');
                    setError('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmText !== 'DELETE MY ACCOUNT'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Deleting Step */}
        {step === 'deleting' && (
          <div className="p-6 flex flex-col items-center justify-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-gray-700 font-semibold">Deleting your account...</p>
            <p className="text-sm text-gray-600 text-center">
              This may take a few moments. Please don't close this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
