import { useState, useCallback } from 'react';
import { availabilityScheduleAPI } from '@/app/api/apiClient';

export interface DaySchedule {
  enabled: boolean;
  slots: Array<{
    startTime: string;
    endTime: string;
    slotDuration?: number;
    isAvailable?: boolean;
  }>;
}

export interface WeeklyPattern {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface SlotConfig {
  defaultDuration: number; // in minutes
  availableDurations: number[];
  buffer: number; // minutes between slots
}

export interface BookingRules {
  minBookingNotice: number; // hours
  maxAdvanceBooking: number; // days
  cancellationDeadline: number; // hours
}

export interface AvailabilitySchedule {
  _id?: string;
  specialistId?: string;
  type: 'weekly' | 'monthly' | 'custom';
  weeklyPattern: WeeklyPattern;
  slotConfig: SlotConfig;
  bookingRules: BookingRules;
  timezone: string;
  isActive: boolean;
}

export function useAvailabilitySchedule(specialistEmail: string) {
  const [schedule, setSchedule] = useState<AvailabilitySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await availabilityScheduleAPI.getSchedule(specialistEmail);
      setSchedule(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(errorMessage);
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [specialistEmail]);

  const saveSchedule = useCallback(
    async (scheduleData: Partial<AvailabilitySchedule>) => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          specialistEmail,
          ...scheduleData,
        };

        let result;
        if (schedule?._id) {
          // Update existing
          result = await availabilityScheduleAPI.update(schedule._id, payload);
        } else {
          // Create new
          result = await availabilityScheduleAPI.create(payload);
        }

        setSchedule(result.data);
        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save schedule';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [specialistEmail, schedule?._id]
  );

  const deleteSchedule = useCallback(async () => {
    if (!schedule?._id) return;

    setLoading(true);
    setError(null);
    try {
      await availabilityScheduleAPI.delete(schedule._id);
      setSchedule(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [schedule?._id]);

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    saveSchedule,
    deleteSchedule,
  };
}

/**
 * Create a default weekly pattern
 */
export function createDefaultWeeklyPattern(): WeeklyPattern {
  return {
    monday: {
      enabled: true,
      slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
    },
    tuesday: {
      enabled: true,
      slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
    },
    wednesday: {
      enabled: true,
      slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
    },
    thursday: {
      enabled: true,
      slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
    },
    friday: {
      enabled: true,
      slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: true }],
    },
    saturday: {
      enabled: false,
      slots: [{ startTime: '10:00', endTime: '14:00', isAvailable: true }],
    },
    sunday: {
      enabled: false,
      slots: [{ startTime: '10:00', endTime: '14:00', isAvailable: true }],
    },
  };
}

/**
 * Create default slot config
 */
export function createDefaultSlotConfig(): SlotConfig {
  return {
    defaultDuration: 60,
    availableDurations: [30, 45, 60, 90],
    buffer: 0,
  };
}

/**
 * Create default booking rules
 */
export function createDefaultBookingRules(): BookingRules {
  return {
    minBookingNotice: 24,
    maxAdvanceBooking: 90,
    cancellationDeadline: 24,
  };
}
