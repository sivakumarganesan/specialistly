import { useState, useCallback, useEffect } from 'react';

export interface Booking {
  customerId: string;
  customerEmail: string;
  customerName: string;
  bookedAt: string;
}

export interface ConsultingSlot {
  _id: string;
  specialistId: string;
  specialistEmail: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCapacity: number;
  bookedCount: number;
  isFullyBooked: boolean;
  status: 'active' | 'inactive';
  bookings: Booking[];
  timezone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlotStats {
  totalSlots: number;
  activeSlots: number;
  inactiveSlots: number;
  upcomingAvailable: number;
  upcomingBooked: number;
  pastSlots: number;
  totalBookings: number;
}

interface CreateSlotData {
  specialistEmail: string;
  specialistId?: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  timezone?: string;
  notes?: string;
}

interface UpdateSlotData {
  startTime?: string;
  endTime?: string;
  status?: 'active' | 'inactive';
  notes?: string;
}

interface BookSlotData {
  customerId: string;
  customerEmail: string;
  customerName: string;
}

export const useConsultingSlots = (specialistEmail: string) => {
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [stats, setStats] = useState<SlotStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch specialist's slots
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/consulting-slots/${specialistEmail}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch slots: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setSlots(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch slots');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errMsg);
      console.error('Error fetching slots:', errMsg);
    } finally {
      setLoading(false);
    }
  }, [specialistEmail]);

  // Fetch specialist's stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/consulting-slots/${specialistEmail}/stats`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [specialistEmail]);

  // Create new slot
  const createSlot = useCallback(
    async (slotData: CreateSlotData) => {
      try {
        const response = await fetch('/api/consulting-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slotData),
        });
        const data = await response.json();
        
        if (data.success) {
          await fetchSlots();
          await fetchStats();
          return { success: true, data: data.data };
        } else {
          return {
            success: false,
            message: data.message || 'Failed to create slot',
            conflictingSlots: data.conflictingSlots,
          };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, message: errMsg };
      }
    },
    [fetchSlots, fetchStats]
  );

  // Update slot
  const updateSlot = useCallback(
    async (slotId: string, updates: UpdateSlotData) => {
      try {
        const response = await fetch(`/api/consulting-slots/${slotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        
        if (data.success) {
          await fetchSlots();
          await fetchStats();
          return { success: true, data: data.data };
        } else {
          return { success: false, message: data.message || 'Failed to update slot' };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, message: errMsg };
      }
    },
    [fetchSlots, fetchStats]
  );

  // Delete slot
  const deleteSlot = useCallback(
    async (slotId: string) => {
      try {
        const response = await fetch(`/api/consulting-slots/${slotId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          await fetchSlots();
          await fetchStats();
          return { success: true };
        } else {
          return {
            success: false,
            message: data.message || 'Failed to delete slot',
            bookings: data.bookings,
          };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, message: errMsg };
      }
    },
    [fetchSlots, fetchStats]
  );

  // Book slot
  const bookSlot = useCallback(
    async (slotId: string, bookingData: BookSlotData) => {
      try {
        const response = await fetch(
          `/api/consulting-slots/${slotId}/book`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
          }
        );
        const data = await response.json();
        
        if (data.success) {
          await fetchSlots();
          await fetchStats();
          return { success: true, data: data.data };
        } else {
          return { success: false, message: data.message || 'Failed to book slot' };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, message: errMsg };
      }
    },
    [fetchSlots, fetchStats]
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (slotId: string, customerId: string) => {
      try {
        const response = await fetch(
          `/api/consulting-slots/${slotId}/book/${customerId}`,
          { method: 'DELETE' }
        );
        const data = await response.json();
        
        if (data.success) {
          await fetchSlots();
          await fetchStats();
          return { success: true, data: data.data };
        } else {
          return { success: false, message: data.message || 'Failed to cancel booking' };
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        return { success: false, message: errMsg };
      }
    },
    [fetchSlots, fetchStats]
  );

  // Load data on mount
  useEffect(() => {
    if (specialistEmail) {
      fetchSlots();
      fetchStats();
    }
  }, [specialistEmail, fetchSlots, fetchStats]);

  return {
    slots,
    stats,
    loading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    bookSlot,
    cancelBooking,
    refetch: fetchSlots,
  };
};
