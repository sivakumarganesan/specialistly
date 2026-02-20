import { useState, useEffect } from 'react';
import { consultingSlotAPI } from '@/app/api/apiClient';
import { ConsultingSlotBookingModal } from '@/app/components/ConsultingSlotBookingModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';

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

interface ConsultingSlotCalendarProps {
  specialistEmail: string;
  onSelectSlot?: (slot: ConsultingSlot) => void;
  defaultDuration?: number;
}

export function ConsultingSlotCalendar({
  specialistEmail,
  onSelectSlot,
  defaultDuration = 60,
}: ConsultingSlotCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ConsultingSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch available slots for the current month
  useEffect(() => {
    fetchAvailableSlots();
  }, [currentDate, specialistEmail]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for the current month
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDate = monthStart.toISOString().split('T')[0];
      const endDate = monthEnd.toISOString().split('T')[0];

      // Fetch available slots from the backend
      const response = await consultingSlotAPI.getAvailableForCustomer(
        specialistEmail,
        startDate,
        endDate
      );

      if (response?.data) {
        const filteredSlots = (Array.isArray(response.data) ? response.data : [])
          .filter((slot: any) => {
            // Only show active slots that are not fully booked
            return slot.status === 'active' && !slot.isFullyBooked;
          })
          .sort((a: any, b: any) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
          });

        setSlots(filteredSlots);
      } else {
        setSlots([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available slots';
      setError(errorMessage);
      console.error('Error fetching available slots:', err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSelectSlot = (slot: ConsultingSlot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
    if (onSelectSlot) {
      onSelectSlot(slot);
    }
  };

  // Group slots by date for easier display
  const slotsByDate = slots.reduce((acc: Record<string, ConsultingSlot[]>, slot) => {
    const date = slot.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: firstDayOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Consulting Slots</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">{monthName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Select a time slot to book a consulting session with the specialist
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md flex items-center gap-2 bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading available slots...</div>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No available slots for {monthName}</p>
                <p className="text-sm mt-1">Try checking another month or contact the specialist</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mini calendar header */}
              <div className="mb-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-xs font-semibold text-center text-gray-600 h-8 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, idx) => {
                    const dateStr = day
                      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      : '';
                    const hasSlots = dateStr && slotsByDate[dateStr] && slotsByDate[dateStr].length > 0;

                    return (
                      <div
                        key={idx}
                        className={`h-8 flex items-center justify-center text-sm rounded ${
                          day === null
                            ? ''
                            : hasSlots
                            ? 'bg-indigo-100 text-indigo-900 font-semibold cursor-pointer hover:bg-indigo-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slots grouped by date */}
              <div className="space-y-4">
                {Object.entries(slotsByDate)
                  .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                  .map(([date, dateSlots]) => {
                    const dateObj = new Date(date);
                    const dateLabel = dateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <div key={date} className="border rounded-lg p-3 space-y-2">
                        <h3 className="font-semibold text-sm text-gray-900">{dateLabel}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {dateSlots.map((slot) => (
                            <button
                              key={slot._id}
                              onClick={() => handleSelectSlot(slot)}
                              className={`p-2 rounded-md text-xs font-medium transition-colors ${
                                selectedSlot?._id === slot._id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-900 hover:bg-indigo-100'
                              }`}
                              title={`${slot.startTime} - ${slot.endTime} (${slot.duration} min)`}
                            >
                              <div className="text-sm">{slot.startTime}</div>
                              <div className="text-xs opacity-75">{slot.duration}m</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected slot details */}
              {selectedSlot && (
                <Card className="mt-4 border-indigo-200 bg-indigo-50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Selected Slot:</h3>
                    <div className="space-y-1 text-sm mb-4">
                      <p>
                        <span className="text-gray-600">Date:</span>{' '}
                        <span className="font-medium">
                          {new Date(selectedSlot.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Time:</span>{' '}
                        <span className="font-medium">
                          {selectedSlot.startTime} - {selectedSlot.endTime}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Duration:</span>{' '}
                        <span className="font-medium">{selectedSlot.duration} minutes</span>
                      </p>
                      <p>
                        <span className="text-gray-600">Available Spots:</span>{' '}
                        <span className="font-medium">
                          {selectedSlot.totalCapacity - selectedSlot.bookedCount} of {selectedSlot.totalCapacity}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Proceed to Book
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <ConsultingSlotBookingModal
        isOpen={showBookingModal}
        selectedSlot={selectedSlot}
        specialistEmail={specialistEmail}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedSlot(null);
        }}
        onSuccess={() => {
          // Refresh slots after successful booking
          fetchAvailableSlots();
        }}
      />
    </div>
  );
}
