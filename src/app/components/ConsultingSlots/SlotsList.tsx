import { useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ConsultingSlot } from '@/app/hooks/useConsultingSlots';
import { Skeleton } from '@/app/components/ui/skeleton';

interface SlotsListProps {
  slots: ConsultingSlot[];
  loading: boolean;
  onEdit: (slot: ConsultingSlot) => void;
  onDelete: (slot: ConsultingSlot) => void;
  onViewDetails: (slot: ConsultingSlot) => void;
  filter?: 'all' | 'upcoming' | 'past' | 'available' | 'booked';
}

export function SlotsList({
  slots,
  loading,
  onEdit,
  onDelete,
  onViewDetails,
  filter = 'all',
}: SlotsListProps) {
  const filteredSlots = useMemo(() => {
    const now = new Date();
    return slots
      .filter((slot) => {
        const slotDate = new Date(slot.date);

        if (filter === 'upcoming') return slotDate >= now;
        if (filter === 'past') return slotDate < now;
        if (filter === 'available') {
          return slotDate >= now && !slot.isFullyBooked && slot.status === 'active';
        }
        if (filter === 'booked') {
          return slotDate >= now && slot.bookedCount > 0 && slot.status === 'active';
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [slots, filter]);

  const getStatusBadge = (slot: ConsultingSlot) => {
    const now = new Date();
    const slotDate = new Date(slot.date);

    if (slotDate < now) {
      return <Badge variant="outline">Past</Badge>;
    }

    if (slot.status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (slot.isFullyBooked) {
      return <Badge variant="destructive">Booked</Badge>;
    }

    return <Badge variant="default">Available</Badge>;
  };

  const canEdit = (slot: ConsultingSlot) => {
    const now = new Date();
    const slotDate = new Date(slot.date);
    return slotDate >= now && !slot.isFullyBooked;
  };

  const canDelete = (slot: ConsultingSlot) => {
    return slot.bookings.length === 0;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (filteredSlots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-600">
          {filter === 'all'
            ? 'No slots found. Create one to get started.'
            : `No ${filter} slots found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Date & Time</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSlots.map((slot) => {
            const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit',
            });
            const timeRange = `${slot.startTime}-${slot.endTime}`;

            return (
              <TableRow key={slot._id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium">{dateStr}</div>
                  <div className="text-sm text-gray-600">{timeRange}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span
                      className={
                        slot.isFullyBooked
                          ? 'font-medium text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {slot.bookedCount}/{slot.totalCapacity}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {slot.duration} min
                </TableCell>
                <TableCell>{getStatusBadge(slot)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(slot)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(slot)}
                      disabled={!canEdit(slot)}
                      title={!canEdit(slot) ? 'Cannot edit past or fully booked slots' : ''}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(slot)}
                      disabled={!canDelete(slot)}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                      title={!canDelete(slot) ? 'Cannot delete slots with bookings' : ''}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
