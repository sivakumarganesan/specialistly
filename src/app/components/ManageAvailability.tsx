import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import {
  useAvailabilitySchedule,
  createDefaultWeeklyPattern,
  createDefaultSlotConfig,
  createDefaultBookingRules,
  type WeeklyPattern,
  type SlotConfig,
  type BookingRules,
} from '@/app/hooks/useAvailabilitySchedule';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { AlertCircle, Plus, Trash2, Clock } from 'lucide-react';

export function ManageAvailability() {
  const { user } = useAuth();
  const { schedule, loading, error, fetchSchedule, saveSchedule } = useAvailabilitySchedule(
    user?.email || ''
  );

  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern>(createDefaultWeeklyPattern());
  const [slotConfig, setSlotConfig] = useState<SlotConfig>(createDefaultSlotConfig());
  const [bookingRules, setBookingRules] = useState<BookingRules>(createDefaultBookingRules());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  useEffect(() => {
    if (user?.email) {
      fetchSchedule();
    }
  }, [user?.email, fetchSchedule]);

  useEffect(() => {
    if (schedule) {
      setWeeklyPattern(schedule.weeklyPattern || createDefaultWeeklyPattern());
      setSlotConfig(schedule.slotConfig || createDefaultSlotConfig());
      setBookingRules(schedule.bookingRules || createDefaultBookingRules());
    }
  }, [schedule]);

  const handleDayToggle = (day: typeof days[number]) => {
    setWeeklyPattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeChange = (
    day: typeof days[number],
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setWeeklyPattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const handleAddTimeSlot = (day: typeof days[number]) => {
    setWeeklyPattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [
          ...prev[day].slots,
          { startTime: '14:00', endTime: '15:00', isAvailable: true },
        ],
      },
    }));
  };

  const handleRemoveTimeSlot = (day: typeof days[number], slotIndex: number) => {
    setWeeklyPattern((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, idx) => idx !== slotIndex),
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveSchedule({
        weeklyPattern,
        slotConfig,
        bookingRules,
      });
      setSaveMessage('✓ Availability settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(`Failed to save: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !schedule) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading availability settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {saveMessage && (
        <div
          className={`p-3 rounded-md flex items-center gap-2 ${
            saveMessage.includes('✓')
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <AlertCircle
            className={`w-4 h-4 ${
              saveMessage.includes('✓') ? 'text-green-600' : 'text-red-600'
            }`}
          />
          <span className={saveMessage.includes('✓') ? 'text-green-700' : 'text-red-700'}>
            {saveMessage}
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md flex items-center gap-2 bg-yellow-50 border border-yellow-200">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700">{error}</span>
        </div>
      )}

      {/* Slot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Slot Configuration
          </CardTitle>
          <CardDescription>Set default duration and buffer time between slots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Slot Duration</label>
              <select
                value={slotConfig.defaultDuration}
                onChange={(e) =>
                  setSlotConfig({ ...slotConfig, defaultDuration: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buffer Time Between Slots</label>
              <select
                value={slotConfig.buffer}
                onChange={(e) =>
                  setSlotConfig({ ...slotConfig, buffer: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Rules</CardTitle>
          <CardDescription>Control booking constraints and deadlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Booking Notice (hours)</label>
              <input
                type="number"
                min="0"
                value={bookingRules.minBookingNotice}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    minBookingNotice: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Advance Booking (days)</label>
              <input
                type="number"
                min="1"
                value={bookingRules.maxAdvanceBooking}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    maxAdvanceBooking: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cancellation Deadline (hours)</label>
              <input
                type="number"
                min="0"
                value={bookingRules.cancellationDeadline}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    cancellationDeadline: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>Set your available time slots for each day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div key={day} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyPattern[day].enabled}
                    onChange={() => handleDayToggle(day)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-lg">{dayLabels[day]}</span>
                </label>
              </div>

              {weeklyPattern[day].enabled && (
                <div className="ml-8 space-y-2">
                  {weeklyPattern[day].slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleTimeChange(day, slotIndex, 'startTime', e.target.value)
                        }
                        className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleTimeChange(day, slotIndex, 'endTime', e.target.value)
                        }
                        className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {weeklyPattern[day].slots.length > 1 && (
                        <button
                          onClick={() => handleRemoveTimeSlot(day, slotIndex)}
                          className="ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => handleAddTimeSlot(day)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add another time slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? 'Saving...' : 'Save Availability Settings'}
        </Button>
      </div>
    </div>
  );
}
