import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { consultingSlotAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertCircle, Calendar, Clock, CheckCircle, X } from 'lucide-react';

interface ConsultingSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  bookedCount: number;
  totalCapacity: number;
  isFullyBooked: boolean;
}

interface ConsultingSlotBookingModalProps {
  isOpen: boolean;
  selectedSlot: ConsultingSlot | null;
  specialistEmail: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConsultingSlotBookingModal({
  isOpen,
  selectedSlot,
  specialistEmail,
  onClose,
  onSuccess,
}: ConsultingSlotBookingModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingMessage, setBookingMessage] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  if (!isOpen || !selectedSlot) {
    return null;
  }

  const handleCompleteBooking = async () => {
    if (!user?.email || !user?.id) {
      setError('Please login to book a slot');
      return;
    }

    setIsLoading(true);
    setBookingStatus('loading');
    setError(null);

    try {
      const bookingData = {
        customerId: user.id,
        customerEmail: user.email,
        customerName: user.name || user.email.split('@')[0],
      };

      const response = await consultingSlotAPI.book(selectedSlot._id, bookingData);

      if (response?.success || response?.data) {
        setBookingStatus('success');
        setBookingMessage('Your consulting slot has been booked successfully! Check your email for meeting details.');
        setAdditionalNotes('');
        
        // Call success callback after 2 seconds
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setBookingStatus('error');
        setError(response?.message || 'Failed to book slot. Please try again.');
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingStatus('error');
      setError(err?.message || 'Error booking slot. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const slotDate = new Date(selectedSlot.date);
  const dateLabel = slotDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeLabel = `${selectedSlot.startTime} - ${selectedSlot.endTime}`;
  const availableSpots = selectedSlot.totalCapacity - selectedSlot.bookedCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Confirm Your Booking</CardTitle>
              <CardDescription className="text-indigo-100">
                Review and complete your consulting slot booking
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Success Message */}
          {bookingStatus === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-green-700">{bookingMessage}</h3>
              <p className="text-sm text-gray-600">
                Redirecting you back in a moment...
              </p>
            </div>
          )}

          {/* Booking Form */}
          {bookingStatus === 'idle' && (
            <>
              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Slot Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Slot Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-600">Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{dateLabel}</p>
                  </div>

                  {/* Time */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Time</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{timeLabel}</p>
                  </div>

                  {/* Duration */}
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="text-sm font-medium text-gray-600">Duration</span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedSlot.duration} minutes</p>
                  </div>

                  {/* Available Spots */}
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-sm font-medium text-gray-600">Availability</span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {availableSpots} spot{availableSpots !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-gray-900">Your Information</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Share any specific topics you'd like to discuss, questions you have, or any other relevant information..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                  />
                </div>
              </div>

              {/* Important Info */}
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900">
                      Important Information
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>✓ A confirmation email will be sent to {user?.email}</li>
                      <li>✓ You'll receive meeting details and any required links 24 hours before the session</li>
                      <li>✓ Please cancel at least 24 hours in advance if you need to reschedule</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Status */}
          {bookingStatus === 'error' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-700">{error || 'Booking Failed'}</h3>
              <p className="text-sm text-gray-600">
                Please try again or contact the specialist directly if the problem persists.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 border-t pt-6">
            <button
              onClick={onClose}
              disabled={isLoading || bookingStatus === 'success'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingStatus === 'success' ? 'Closing...' : 'Cancel'}
            </button>

            {bookingStatus === 'idle' && (
              <button
                onClick={handleCompleteBooking}
                disabled={isLoading || !user?.email}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Booking
                  </>
                )}
              </button>
            )}

            {bookingStatus === 'error' && (
              <button
                onClick={() => setBookingStatus('idle')}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
