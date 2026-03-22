import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ConsultingSlot } from '@/app/hooks/useConsultingSlots';

interface SlotDetailsViewProps {
  isOpen: boolean;
  slot: ConsultingSlot | null;
  onClose: () => void;
}

export function SlotDetailsView({ isOpen, slot, onClose }: SlotDetailsViewProps) {
  if (!slot) return null;

  const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statusBadgeVariant =
    slot.status === 'active'
      ? slot.isFullyBooked
        ? 'destructive'
        : 'default'
      : 'secondary';

  const statusText =
    slot.status === 'inactive'
      ? 'Inactive'
      : slot.isFullyBooked
        ? 'Fully Booked'
        : 'Available';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Slot Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Date & Time</h3>
            <p className="text-lg font-medium">{dateStr}</p>
            <p className="text-2xl font-bold mt-2">
              {slot.startTime} – {slot.endTime}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Duration: {slot.duration} minutes
            </p>
            <p className="text-sm text-gray-600">
              Timezone: {slot.timezone}
            </p>
          </div>

          {/* Capacity */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Capacity</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Booked / Total</span>
              <span className="text-2xl font-bold">
                {slot.bookedCount} / {slot.totalCapacity}
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={
                  slot.isFullyBooked ? 'bg-red-500' : 'bg-green-500'
                }
                style={{
                  width: `${
                    (slot.bookedCount / slot.totalCapacity) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Status</h3>
            <Badge variant={statusBadgeVariant as any}>{statusText}</Badge>
          </div>

          {/* Bookings */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">
              Bookings ({slot.bookings.length})
            </h3>
            {slot.bookings.length === 0 ? (
              <p className="text-gray-600 text-sm">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {slot.bookings.map((booking, idx) => (
                  <div
                    key={idx}
                    className="rounded-md bg-gray-50 p-3 text-sm"
                  >
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-gray-600">{booking.customerEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Booked:{' '}
                      {new Date(booking.bookedAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {slot.notes && (
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3">Notes</h3>
              <p className="text-sm text-gray-700">{slot.notes}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Created: {new Date(slot.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(slot.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
