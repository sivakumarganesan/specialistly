import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { consultingSlotAPI, API_BASE_URL } from '@/app/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, Calendar, Clock, Video, Copy, ExternalLink, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

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
  totalCapacity: number;
  bookedCount: number;
}

export function SpecialistMeetingManager() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingZoomFor, setCreatingZoomFor] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSpecialistSlots();
  }, []);

  const fetchSpecialistSlots = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.email) {
        setError('Please login to view your appointments');
        return;
      }

      // Fetch specialist's upcoming slots
      const response = await consultingSlotAPI.getSlots(user.email);

      if (response?.success) {
        // Filter for future slots with bookings
        const now = new Date();
        const futureSlots = response.data
          .filter((slot: ConsultingSlot) => {
            const slotDateTime = new Date(slot.date);
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            slotDateTime.setHours(hours, minutes, 0);
            return slotDateTime > now && slot.bookings.length > 0;
          })
          .sort((a: ConsultingSlot, b: ConsultingSlot) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });

        setSlots(futureSlots);
      } else {
        setError(response?.message || 'Failed to fetch appointments');
      }
    } catch (err: any) {
      console.error('Error fetching specialist slots:', err);
      setError(err?.message || 'Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateZoomMeeting = async (slotId: string, bookingIndex: number) => {
    try {
      setCreatingZoomFor(`${slotId}-${bookingIndex}`);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/consulting-slots/${slotId}/booking/${bookingIndex}/create-zoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('Zoom meeting already created for this booking');
        } else {
          setError(data?.message || 'Failed to create Zoom meeting');
        }
        return;
      }

      // Update slots with new Zoom meeting data
      setSlots((prevSlots) =>
        prevSlots.map((slot) =>
          slot._id === slotId
            ? {
                ...slot,
                bookings: slot.bookings.map((booking, index) =>
                  index === bookingIndex
                    ? { ...booking, zoomMeeting: data.data.zoomMeeting }
                    : booking
                ),
              }
            : slot
        )
      );

      setSuccessMessage('Zoom meeting created successfully! Customer has been notified.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error creating Zoom meeting:', err);
      setError(err?.message || 'Error creating Zoom meeting');
    } finally {
      setCreatingZoomFor(null);
    }
  };

  const copyToClipboard = (text: string, meetingId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMeetingId(meetingId);
    setTimeout(() => setCopiedMeetingId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Your Appointments & Zoom Meetings</h1>
        <p className="text-gray-600">Manage your upcoming consulting sessions and create Zoom meeting links</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {slots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Appointments</h3>
            <p className="text-gray-600">You don't have any upcoming appointments with bookings right now.</p>
          </CardContent>
        </Card>
      ) : (
        /* Appointments List */
        <div className="space-y-4">
          {slots.map((slot) => {
            const slotDate = new Date(slot.date);
            const dateLabel = slotDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <Card key={slot._id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{dateLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{slot.startTime} - {slot.endTime} ({slot.duration} min)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">
                        {slot.bookings.length} / {slot.totalCapacity} booked
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Bookings */}
                  <div className="space-y-4">
                    {slot.bookings.map((booking, bookingIndex) => (
                      <div key={bookingIndex} className="p-4 border rounded-lg">
                        {/* Customer Info */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                          <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Zoom Meeting Status */}
                        {booking.zoomMeeting && booking.zoomMeeting.zoomMeetingId ? (
                          /* Meeting Created */
                          <div className="space-y-3 p-3 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Zoom Meeting Created</span>
                            </div>

                            {/* Meeting ID */}
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">Meeting ID:</p>
                              <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                                <code className="font-mono text-sm text-gray-900 flex-1">
                                  {booking.zoomMeeting.zoomMeetingId}
                                </code>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      booking.zoomMeeting.zoomMeetingId,
                                      booking.zoomMeeting.zoomMeetingId
                                    )
                                  }
                                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <Copy
                                    className={`w-4 h-4 ${
                                      copiedMeetingId === booking.zoomMeeting.zoomMeetingId
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
                                <p className="text-sm text-gray-600">Password:</p>
                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                                  <code className="font-mono text-sm text-gray-900 flex-1">
                                    {booking.zoomMeeting.password}
                                  </code>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(booking.zoomMeeting.password, 'password-' + bookingIndex)
                                    }
                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    <Copy
                                      className={`w-4 h-4 ${
                                        copiedMeetingId === 'password-' + bookingIndex
                                          ? 'text-green-600'
                                          : 'text-gray-400'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Meeting Links */}
                            <div className="space-y-2 pt-2">
                              <a
                                href={booking.zoomMeeting.startUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 w-full px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm justify-center"
                              >
                                <Video className="w-4 h-4" />
                                Start Meeting as Host
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>

                            <p className="text-xs text-green-700 pt-2">
                              ✓ Customer has been notified with the join link
                            </p>
                          </div>
                        ) : (
                          /* Meeting Not Created */
                          <div className="space-y-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-700">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">Zoom Meeting Not Created</span>
                            </div>

                            <p className="text-sm text-amber-700">
                              Click the button below to create a Zoom meeting link for this appointment.
                            </p>

                            <button
                              onClick={() => handleCreateZoomMeeting(slot._id, bookingIndex)}
                              disabled={creatingZoomFor === `${slot._id}-${bookingIndex}`}
                              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {creatingZoomFor === `${slot._id}-${bookingIndex}` ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Creating Meeting...
                                </>
                              ) : (
                                <>
                                  <Video className="w-4 h-4" />
                                  Create Zoom Meeting
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
