# Phase 2: Specialist UI - Implementation Checklist

## Status: Ready to Start ✅

**Prerequisites Met:**
- ✅ Backend Phase 1 Complete (Commit: 522ebd9)
- ✅ API documented (CONSULTING_SLOTS_API_REFERENCE.md)
- ✅ Testing guide created (CONSULTING_SLOTS_TESTING_GUIDE.md)
- ✅ Postman collection ready (CONSULTING_SLOTS_API.postman_collection.json)

---

## Phase 2: Specialist Dashboard UI

### Overview

Create a centralized "Manage Slots" dashboard for specialists to:
1. **View** all their consulting slots
2. **Create** new slots (single or bulk)
3. **Edit** slot times/status
4. **Delete** empty slots
5. **See stats** (available/booked counts)

### Components to Build

#### 1. `ManageSlots.tsx` (Main Container)

**Purpose:** Dashboard layout with stats + slot list + action buttons

**Props:** None (fetches from context/API)

**State:**
```typescript
const [slots, setSlots] = useState<ConsultingSlot[]>([]);
const [stats, setStats] = useState<SlotStats>({});
const [loading, setLoading] = useState(false);
const [showCreateModal, setShowCreateModal] = useState(false);
const [selectedSlot, setSelectedSlot] = useState(null);
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Manage Consulting Slots                             │
├─────────────────────────────────────────────────────┤
│ [📊 Stats Panel - 3 cards]                          │
│ ├─ Total Slots: 5                                   │
│ ├─ Available: 3                                     │
│ └─ Booked: 2                                        │
├─────────────────────────────────────────────────────┤
│ [🔘 Create Slot] [📄 Bulk Import]                  │
├─────────────────────────────────────────────────────┤
│ [📋 Slots List Component]                           │
│ ├─ Feb 20, 14:00-15:00 | 0/1 | [Edit] [Delete]    │
│ ├─ Feb 21, 10:00-11:00 | 1/1 | [Edit] [View]      │
│ └─ Feb 22, 15:00-16:00 | 0/1 | [Edit] [Delete]    │
└─────────────────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/consulting-slots/:specialistEmail` → Load slots
- `GET /api/consulting-slots/:specialistEmail/stats` → Load stats

**Key Features:**
- Loading spinner while fetching
- Empty state message if no slots
- Refetch on create/update/delete
- Filter by: upcoming, past, booked, available

---

#### 2. `CreateSlotModal.tsx`

**Purpose:** Form to create new slot

**Props:**
```typescript
interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slot: ConsultingSlot) => void;
  specialistEmail: string;
}
```

**Form Fields:**
```
┌─────────────────────────────┐
│ Create New Consulting Slot  │
├─────────────────────────────┤
│ Date:        [📅 Feb 20]    │
│ Start Time:  [⏰ 14:00]     │
│ End Time:    [⏰ 15:00]     │
│ Capacity:    [1 🧑]         │
│ Timezone:    [UTC dropdown] │
│ Notes:       [text area]    │
├─────────────────────────────┤
│ [Cancel] [Create]           │
└─────────────────────────────┘
```

**Validation:**
```typescript
- Date must be future date
- End time > start time
- Capacity must be >= 1
- Check for time conflicts → Show warning if overlaps
```

**API Call:**
```typescript
POST /api/consulting-slots
{
  specialistEmail: string,
  date: string ("2026-02-20"),
  startTime: string ("14:00"),
  endTime: string ("15:00"),
  totalCapacity: number,
  timezone: string
}
```

**Success Handler:**
- Show toast: "Slot created successfully"
- Call `onSuccess()` to refresh parent list
- Close modal

**Error Handler:**
```typescript
if (error.status === 409) {
  // Show: "Time conflict with existing slot"
  // Show conflicting slot times
}
```

---

#### 3. `SlotsList.tsx`

**Purpose:** Display all specialist's slots in table/card format

**Props:**
```typescript
interface SlotsListProps {
  slots: ConsultingSlot[];
  loading: boolean;
  onEdit: (slot: ConsultingSlot) => void;
  onDelete: (slot: ConsultingSlot) => void;
  onViewDetails: (slot: ConsultingSlot) => void;
}
```

**Data Display:**
```
┌────────────────────────────────────────────────────────┐
│ Date & Time      │ Capacity │ Status │ Actions        │
├────────────────────────────────────────────────────────┤
│ Feb 20, 14:00-15:00 │ 0/1    │ ✅ Available │ Edit Delete │
│ Feb 21, 10:00-11:00 │ 1/1    │ ❌ Booked    │ View        │
│ Feb 22, 15:00-16:00 │ 0/1    │ ✅ Available │ Edit Delete │
│ Jan 15, 09:00-10:00 │ 1/1    │ ⏱️  Past     │ View        │
└────────────────────────────────────────────────────────┘
```

**Column Definitions:**
- **Date & Time:** Format as "Feb 20, 14:00-15:00"
- **Capacity:** Show "0/1" (booked/total)
- **Status:** Badge (Available/Booked/Past)
- **Actions:** Edit/Delete/View buttons

**Sorting/Filtering:**
- Default: Sort by date ascending (upcoming first)
- Filter tabs: All | Upcoming | Past | Booked | Available

**Conditional Actions:**
```typescript
const canEdit = !slot.isFullyBooked && isUpcoming(slot.date);
const canDelete = !slot.bookings.length && isUpcoming(slot.date);
const canCancel = slot.bookings.length > 0;
```

---

#### 4. `EditSlotModal.tsx`

**Purpose:** Edit slot times/status (but not capacity if booked)

**Props:**
```typescript
interface EditSlotModalProps {
  isOpen: boolean;
  slot: ConsultingSlot;
  onClose: () => void;
  onSuccess: (updated: ConsultingSlot) => void;
}
```

**Form Fields:**
```
Same as Create, but:
- Date: Disabled if slot has bookings
- Capacity: Disabled if slot has bookings
- Start/End Time: Can edit if no bookings
- Status: Can mark as "inactive"
```

**Warnings:**
```typescript
if (slot.bookings.length > 0) {
  <Alert>
    This slot has {slot.bookings.length} booking(s).
    You cannot change the date or capacity.
    To modify these, cancel all bookings first.
  </Alert>
}
```

**API Call:**
```typescript
PUT /api/consulting-slots/:slotId
{
  startTime?: string,
  endTime?: string,
  status?: "active" | "inactive",
  notes?: string
}
```

---

#### 5. `DeleteConfirmDialog.tsx`

**Purpose:** Confirmation before deleting slot

**Props:**
```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  slot: ConsultingSlot;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}
```

**Dialog Content:**
```
┌──────────────────────────────────┐
│ Delete Slot?                     │
├──────────────────────────────────┤
│ Are you sure you want to delete  │
│ this slot?                       │
│                                  │
│ Feb 20, 14:00-15:00              │
│ Capacity: 0/1 (Empty)            │
│                                  │
│ This action cannot be undone.    │
├──────────────────────────────────┤
│ [Cancel] [Delete]                │
└──────────────────────────────────┘
```

**Checks:**
```typescript
if (slot.bookings.length > 0) {
  <Alert type="error">
    Cannot delete slot with active bookings.
    Please cancel all bookings first.
  </Alert>
}
```

**API Call:**
```typescript
DELETE /api/consulting-slots/:slotId
```

---

### 6. `useConsultingSlots.ts` (Custom Hook)

**Purpose:** Centralized API calls and state management

```typescript
export const useConsultingSlots = (specialistEmail: string) => {
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch specialist's slots
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/consulting-slots/${specialistEmail}`
      );
      const data = await response.json();
      setSlots(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
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
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    }
  }, [specialistEmail]);

  // Create new slot
  const createSlot = useCallback(async (slotData) => {
    try {
      const response = await fetch('/api/consulting-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData)
      });
      const data = await response.json();
      if (data.success) {
        await fetchSlots();
        await fetchStats();
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [fetchSlots, fetchStats]);

  // Update slot
  const updateSlot = useCallback(async (slotId, updates) => {
    try {
      const response = await fetch(
        `/api/consulting-slots/${slotId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchSlots();
        await fetchStats();
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [fetchSlots, fetchStats]);

  // Delete slot
  const deleteSlot = useCallback(async (slotId) => {
    try {
      const response = await fetch(
        `/api/consulting-slots/${slotId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        await fetchSlots();
        await fetchStats();
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [fetchSlots, fetchStats]);

  // Load data on mount
  useEffect(() => {
    fetchSlots();
    fetchStats();
  }, [fetchSlots, fetchStats]);

  return {
    slots,
    stats,
    loading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    refetch: fetchSlots
  };
};
```

---

## Implementation Order

1. ✅ Create `useConsultingSlots.ts` (hook for API calls)
2. ✅ Create `ManageSlots.tsx` (main dashboard)
3. ✅ Create `SlotsList.tsx` (display list)
4. ✅ Create `CreateSlotModal.tsx` (add new)
5. ✅ Create `EditSlotModal.tsx` (modify existing)
6. ✅ Create `DeleteConfirmDialog.tsx` (delete confirmation)
7. ✅ Integration: Add route to specialist dashboard
8. ✅ Integration: Add navigation link

---

## File Locations

```
frontend/
└── src/
    ├── components/
    │   └── ConsultingSlots/
    │       ├── ManageSlots.tsx
    │       ├── CreateSlotModal.tsx
    │       ├── EditSlotModal.tsx
    │       ├── SlotsList.tsx
    │       ├── DeleteConfirmDialog.tsx
    │       └── index.ts
    └── hooks/
        └── useConsultingSlots.ts
```

---

## Integration Points

### 1. Add Route to Specialist Dashboard

**File:** `frontend/src/pages/SpecialistDashboard.tsx`

```typescript
import ManageSlots from '../components/ConsultingSlots/ManageSlots';

export const SpecialistDashboard = () => {
  return (
    <div className="dashboard">
      <nav>
        <a href="#profile">Profile</a>
        <a href="#services">Services</a>
        <a href="#slots">Manage Slots</a>  {/* ← NEW */}
        <a href="#bookings">Bookings</a>
      </nav>

      <section id="slots">
        <ManageSlots />             {/* ← NEW COMPONENT */}
      </section>
    </div>
  );
};
```

### 2. Add Navigation Link

**File:** `frontend/src/components/Navbar.tsx`

```typescript
<a href="/specialist/dashboard#slots" className="btn">
  Manage Slots
</a>
```

---

## Styling Approach

**Use existing TailwindCSS classes from project:**

```typescript
// Stats Cards
className="grid grid-cols-3 gap-4 mb-6"
className="bg-white p-6 rounded-lg shadow"

// Buttons
className="btn btn-primary"
className="btn btn-secondary"
className="btn-sm btn-danger"

// Forms
className="form-group mb-4"
className="form-input"
className="form-textarea"

// Table
className="table-responsive"
className="tbody-row"
```

---

## Testing Checklist for Phase 2

- [ ] ManageSlots loads specialist's slots
- [ ] Stats display correct counts
- [ ] Create slot modal validates input
- [ ] Time conflict warning shows
- [ ] Slot displays with correct status badge
- [ ] Can edit available slots
- [ ] Cannot edit booked slots (fields disabled)
- [ ] Delete only works for empty slots
- [ ] After create/update/delete, list refreshes
- [ ] Mobile responsive layout works
- [ ] Loading states show properly
- [ ] Error messages display clearly

---

## Phase 2 Estimated LOC

- `ManageSlots.tsx`: ~150 lines
- `CreateSlotModal.tsx`: ~200 lines
- `EditSlotModal.tsx`: ~180 lines
- `SlotsList.tsx`: ~250 lines
- `DeleteConfirmDialog.tsx`: ~80 lines
- `useConsultingSlots.ts`: ~180 lines
- **Total: ~1,040 lines**

---

## Ready to Start Phase 2? 

**Confirm:**
- Backend API tested ✅?
- Postman collection working ✅?
- Database queries performing ✅?

Then we build the Specialist UI! 🚀

