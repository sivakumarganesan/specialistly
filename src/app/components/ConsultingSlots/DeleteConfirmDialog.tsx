import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ConsultingSlot, Booking } from '@/app/hooks/useConsultingSlots';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  slot: ConsultingSlot | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  slot,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmDialogProps) {
  if (!slot) return null;

  const hasBookings = slot.bookings && slot.bookings.length > 0;
  const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeRange = `${slot.startTime}-${slot.endTime}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Slot?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this consulting slot?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-3">
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <p className="font-medium">{dateStr}</p>
            <p className="text-gray-600">{timeRange}</p>
            <p className="text-gray-600">
              Capacity: {slot.bookedCount}/{slot.totalCapacity}
            </p>
          </div>

          {hasBookings && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot delete slot with {slot.bookings.length} active booking(s).
                Please cancel all bookings first.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-gray-600">This action cannot be undone.</p>
        </div>

        <div className="flex justify-end gap-3">
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading || hasBookings}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
