import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ConsultingSlot } from '@/app/hooks/useConsultingSlots';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

interface EditSlotModalProps {
  isOpen: boolean;
  slot: ConsultingSlot | null;
  onClose: () => void;
  onSuccess: () => void;
  onUpdateSlot: (slotId: string, data: any) => Promise<any>;
  isLoading?: boolean;
}

export function EditSlotModal({
  isOpen,
  slot,
  onClose,
  onSuccess,
  onUpdateSlot,
  isLoading = false,
}: EditSlotModalProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with slot data
  useEffect(() => {
    if (slot && isOpen) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setStatus(slot.status);
      setNotes(slot.notes || '');
      setError(null);
    }
  }, [slot, isOpen]);

  const hasBookings = slot?.bookings && slot.bookings.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;

    setError(null);
    setSubmitting(true);

    try {
      // Validation
      if (!startTime || !endTime) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      if (startTime >= endTime) {
        setError('End time must be after start time');
        setSubmitting(false);
        return;
      }

      const result = await onUpdateSlot(slot._id, {
        startTime,
        endTime,
        status,
        notes,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to update slot');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!slot) return null;

  const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Consulting Slot</DialogTitle>
          <DialogDescription>Update the slot details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasBookings && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">This slot has bookings</p>
                <p className="text-sm">
                  {slot.bookings.length} customer(s) booked. You can only adjust
                  the time if there are no time conflicts with existing bookings.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <p className="font-medium">{dateStr}</p>
            <p className="text-gray-600">
              Capacity: {slot.bookedCount}/{slot.totalCapacity}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'active' | 'inactive')}
              disabled={submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Inactive slots won't appear to customers
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this slot..."
              disabled={submitting}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting || isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
