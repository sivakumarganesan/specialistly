import { useState, useMemo } from 'react';
import { useConsultingSlots, ConsultingSlot } from '@/app/hooks/useConsultingSlots';
import { consultingSlotAPI } from '@/app/api/apiClient';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { AlertCircle, Plus, Calendar, Zap } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CreateSlotModal } from './CreateSlotModal';
import { EditSlotModal } from './EditSlotModal';
import { SlotsList } from './SlotsList';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { SlotDetailsView } from './SlotDetailsView';

interface ManageSlotsProps {
  specialistEmail: string;
  specialistId?: string;
}

type ModalState = 'none' | 'create' | 'edit' | 'delete' | 'details';

export function ManageSlots({
  specialistEmail,
  specialistId,
}: ManageSlotsProps) {
  const {
    slots,
    stats,
    loading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    refetch,
  } = useConsultingSlots(specialistEmail);

  const [modalState, setModalState] = useState<ModalState>('none');
  const [selectedSlot, setSelectedSlot] = useState<ConsultingSlot | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'available' | 'booked'>('all');
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Show success message for 3 seconds
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCreateSlot = async (data: any) => {
    // Don't send specialistId - backend will look it up using specialistEmail
    return createSlot(data);
  };

  const handleEditSlot = (slot: ConsultingSlot) => {
    setSelectedSlot(slot);
    setModalState('edit');
  };

  const handleDeleteSlot = (slot: ConsultingSlot) => {
    setSelectedSlot(slot);
    setModalState('delete');
  };

  const handleConfirmDelete = async () => {
    if (!selectedSlot) return;
    setDeleting(true);
    try {
      const result = await deleteSlot(selectedSlot._id);
      if (result.success) {
        handleSuccess('Slot deleted successfully');
        setModalState('none');
        setSelectedSlot(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateFromAvailability = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await consultingSlotAPI.generateFromAvailability({
        specialistEmail,
        numDays: 90, // Generate for next 90 days
      });

      if (result.success) {
        handleSuccess(
          `✓ Generated ${result.data.count} consulting slots from your availability!`
        );
        // Refetch slots to update the list
        refetch();
        setModalState('none');
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to generate slots';
      setGenerateError(errorMsg);
      handleSuccess(
        errorMsg.includes('No active availability schedule')
          ? 'Please set up your availability first in Settings → Manage Availability'
          : errorMsg
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = (slot: ConsultingSlot) => {
    setSelectedSlot(slot);
    setModalState('details');
  };

  const handleEditSuccess = () => {
    handleSuccess('Slot updated successfully');
    setModalState('none');
    setSelectedSlot(null);
  };

  const handleCreateSuccess = () => {
    handleSuccess('Slot created successfully');
    setModalState('none');
  };

  const upcomingSlots = useMemo(() => {
    const now = new Date();
    return slots.filter((slot) => new Date(slot.date) >= now).length;
  }, [slots]);

  const availableSlots = useMemo(() => {
    return slots.filter((slot) => {
      const now = new Date();
      return (
        new Date(slot.date) >= now &&
        !slot.isFullyBooked &&
        slot.status === 'active'
      );
    }).length;
  }, [slots]);

  const bookedSlots = useMemo(() => {
    return slots.filter((slot) => slot.bookedCount > 0).length;
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Consulting Slots</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your available consulting time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateFromAvailability}
            disabled={generating || loading}
            variant="outline"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            <Zap className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Auto-Generate from Availability'}
          </Button>
          <Button
            onClick={() => setModalState('create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Slot
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            ✓ {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalSlots ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">{upcomingSlots}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {availableSlots} available
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {stats?.totalBookings ?? 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {bookedSlots} slots
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-sm">
                <span className="font-bold text-green-600">
                  {stats?.activeSlots ?? 0}
                </span>
                <span className="text-gray-600"> / {stats?.totalSlots ?? 0} active</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slots List with Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Your Consulting Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={filter}
            onValueChange={(value) =>
              setFilter(value as typeof filter)
            }
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="booked">Booked</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              <SlotsList
                slots={slots}
                loading={loading}
                filter={filter}
                onEdit={handleEditSlot}
                onDelete={handleDeleteSlot}
                onViewDetails={handleViewDetails}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateSlotModal
        isOpen={modalState === 'create'}
        onClose={() => {
          setModalState('none');
          setSelectedSlot(null);
        }}
        onSuccess={handleCreateSuccess}
        specialistEmail={specialistEmail}
        onCreateSlot={handleCreateSlot}
      />

      <EditSlotModal
        isOpen={modalState === 'edit'}
        slot={selectedSlot}
        onClose={() => {
          setModalState('none');
          setSelectedSlot(null);
        }}
        onSuccess={handleEditSuccess}
        onUpdateSlot={updateSlot}
      />

      <DeleteConfirmDialog
        isOpen={modalState === 'delete'}
        slot={selectedSlot}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setModalState('none');
          setSelectedSlot(null);
        }}
        isLoading={deleting}
      />

      <SlotDetailsView
        isOpen={modalState === 'details'}
        slot={selectedSlot}
        onClose={() => {
          setModalState('none');
          setSelectedSlot(null);
        }}
      />
    </div>
  );
}
