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
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  specialistEmail: string;
  onCreateSlot: (data: any) => Promise<any>;
  isLoading?: boolean;
}

export function CreateSlotModal({
  isOpen,
  onClose,
  onSuccess,
  specialistEmail,
  onCreateSlot,
  isLoading = false,
}: CreateSlotModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [timezone, setTimezone] = useState('UTC');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflictingSlots, setConflictingSlots] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setDate('');
      setStartTime('');
      setEndTime('');
      setCapacity('1');
      setTimezone('UTC');
      setNotes('');
      setError(null);
      setConflictingSlots([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflictingSlots([]);
    setSubmitting(true);

    try {
      // Validation
      if (!date || !startTime || !endTime) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      const startDate = new Date(date);
      if (startDate < new Date()) {
        setError('Date must be in the future');
        setSubmitting(false);
        return;
      }

      if (startTime >= endTime) {
        setError('End time must be after start time');
        setSubmitting(false);
        return;
      }

      if (parseInt(capacity) < 1) {
        setError('Capacity must be at least 1');
        setSubmitting(false);
        return;
      }

      const result = await onCreateSlot({
        specialistEmail,
        date,
        startTime,
        endTime,
        totalCapacity: parseInt(capacity),
        timezone,
        notes,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to create slot');
        if (result.conflictingSlots) {
          setConflictingSlots(result.conflictingSlots);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Consulting Slot</DialogTitle>
          <DialogDescription>
            Set up a new time slot for customer consultations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {conflictingSlots.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">
                  Time conflict with existing slot(s):
                </p>
                <ul className="text-sm space-y-1">
                  {conflictingSlots.map((slot, idx) => (
                    <li key={idx}>
                      {slot.startTime} - {slot.endTime}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
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
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="10"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of customers who can book this slot
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option>UTC</option>
              <option>America/New_York</option>
              <option>America/Chicago</option>
              <option>America/Denver</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
              <option>Europe/Paris</option>
              <option>Asia/Tokyo</option>
              <option>Asia/Singapore</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes for this slot..."
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
              {submitting || isLoading ? 'Creating...' : 'Create Slot'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
