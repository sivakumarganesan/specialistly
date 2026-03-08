import { useState, useEffect } from 'react';
import { consultingSlotAPI } from '@/app/api/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { AlertCircle, Calendar, Clock, Video, ExternalLink, Copy, Loader, CheckCircle } from 'lucide-react';

interface ZoomMeeting {
  zoomMeetingId: string;
  joinUrl: string;
  startUrl: string;
  password: string;
  createdAt: string;
}

interface Booking {
  customerId: string;
  customerEmail: string;
  customerName: string;
  bookedAt: string;
  zoomMeeting?: ZoomMeeting;
}

interface ConsultingSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  bookings: Booking[];
  specialistId: string;
  specialistEmail: string;
}

interface AppointmentDetailsViewProps {
  slotId: string;
  bookingIndex?: number;
  onClose?: () => void;
}

export function AppointmentDetailsView({ slotId, bookingIndex = 0, onClose }: AppointmentDetailsViewProps) {
  const [slot, setSlot] = useState<ConsultingSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    fetchSlotDetails();
  }, [slotId]);

  const fetchSlotDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await consultingSlotAPI.getById(slotId);
      if (response?.success) {
        setSlot(response.data);
      } else {
        setError(response?.message || 'Failed to fetch appointment details');
      }
    } catch (err: any) {
      console.error('Error fetching slot details:', err);
      setError(err?.message || 'Error loading appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error || 'Appointment not found'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const booking = slot.bookings[bookingIndex];
  if (!booking) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">Booking not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const slotDate = new Date(slot.date);
  const dateLabel = slotDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasZoomMeeting = booking.zoomMeeting && booking.zoomMeeting.zoomMeetingId;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Appointment Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900">📅 Your Appointment</h2>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Date</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{dateLabel}</p>
            </div>

            {/* Time */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Time</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {slot.startTime} - {slot.endTime}
              </p>
            </div>

            {/* Duration */}
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <span className="text-sm font-medium text-gray-600">Duration</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">{slot.duration} minutes</p>
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {hasZoomMeeting ? '✅ Ready' : '⏳ Pending'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zoom Meeting Section */}
      {hasZoomMeeting ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-green-900">🎥 Zoom Meeting Ready</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Join Button */}
            <a
              href={booking.zoomMeeting.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors justify-center"
            >
              <Video className="w-5 h-5" />
              Join Zoom Meeting
              <ExternalLink className="w-5 h-5" />
            </a>

            <p className="text-sm text-green-700 text-center">
              Click above to join the meeting at the scheduled time
            </p>

            {/* Meeting Details */}
            <div className="space-y-3 pt-4 border-t border-green-200">
              {/* Meeting ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Meeting ID</label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
                  <code className="font-mono text-sm text-gray-900 flex-1">
                    {booking.zoomMeeting.zoomMeetingId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(booking.zoomMeeting.zoomMeetingId)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy
                      className={`w-4 h-4 ${
                        copiedText === booking.zoomMeeting.zoomMeetingId
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Password */}
              {booking.zoomMeeting.password && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
                    <code className="font-mono text-sm text-gray-900 flex-1">
                      {booking.zoomMeeting.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(booking.zoomMeeting.password)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy
                        className={`w-4 h-4 ${
                          copiedText === booking.zoomMeeting.password
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pro Tips */}
            <div className="p-3 rounded-lg bg-white border border-green-200 text-sm text-gray-700 space-y-2">
              <p className="font-medium">✨ Pro Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Join 5 minutes early to test your audio and video</li>
                <li>• Use a stable internet connection for best quality</li>
                <li>• Close unnecessary applications to improve performance</li>
                <li>• Have your calendar or notes ready if needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Zoom Not Created Yet */
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <h3 className="text-xl font-semibold text-amber-900">⏳ Zoom Meeting Pending</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-700">
              Your specialist is preparing the Zoom meeting link. You'll receive an email shortly with the meeting details and join link.
            </p>

            <div className="p-3 rounded-lg bg-white border border-amber-200 text-sm text-gray-700 space-y-2">
              <p className="font-medium">📧 What to expect:</p>
              <ul className="space-y-1 text-xs">
                <li>• Email with Zoom meeting link will be sent soon</li>
                <li>• Check your email a few minutes before the appointment</li>
                <li>• You can also access the link through this page</li>
                <li>• If you don't receive the email, check your spam folder</li>
              </ul>
            </div>

            <button
              onClick={fetchSlotDetails}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Refresh to Check
            </button>
          </CardContent>
        </Card>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}
