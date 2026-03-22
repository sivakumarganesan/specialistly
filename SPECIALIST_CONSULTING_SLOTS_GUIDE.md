# 📅 Specialist's Guide: Setting Up Consulting Slots

**How Specialists Establish Consulting Slots for Customer Bookings**

---

## 🎯 Overview

As a specialist on Specialistly, you can offer consulting services and let customers book time slots with you. This guide walks through the complete process of:

1. ✅ Creating a consulting service
2. ✅ Setting your weekly availability
3. ✅ Activating your service to generate slots
4. ✅ Managing your calendar

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Detailed Steps](#detailed-steps)
3. [Availability Options](#availability-options)
4. [Slot Management](#slot-management)
5. [FAQ](#faq)

---

## 🚀 Quick Start

### Minimum Steps to Start Accepting Bookings:

```
1. Go to Services tab in your Dashboard
2. Click "+ New Service"
3. Select "Consulting" type
4. Fill in title, price, duration
5. Set your weekly availability
6. Click "Create Service"
7. Find the service and change status to "Active"
8. Slots are now available for customers to book!
```

✅ **That's it! You're ready for bookings.**

---

## 📖 Detailed Steps

### Step 1: Access Services Dashboard

```
Location: Dashboard → Services Tab
Path: /dashboard → Services
```

**What you'll see:**
- List of all your services (webinars + consulting)
- Stats showing: Total services, Active services, Booked sessions, Upcoming bookings
- "Set Your Availability" button (only visible if you have consulting services)
- Filter options (All, Active, Draft)

---

### Step 2: Create a New Consulting Service

#### Click "+ New Service" Button

**Service Type Selection:**
```
Choose: "Consulting" (not webinar)
```

#### Fill in Consulting Service Details

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Title** | Service name | "Career Mentoring", "Business Strategy", "Technical Review" |
| **Description** | What you'll help with | "30-min 1:1 career guidance session" |
| **Price** | USD amount per session | "$50", "$150" |
| **Session Duration** | Minutes per slot | "30", "45", "60" (recommended: 30-60) |
| **Availability Type** | How you schedule | "Weekly recurring" or "Single day" (see more below) |

#### Availability Type Options

**For Weekly Recurring (Recommended):**
```
Type: "weekly"
Select days: Mon, Tue, Wed, Thu, Fri (or your preference)
Set times per day: "9:00 AM - 5:00 PM" (or your hours)
System will generate slots automatically for future weeks
```

**For Single Day/Custom:**
```
Type: "single_day"
Pick specific dates you want available
Set time windows for those dates
Best for: Limited time offers, special sessions
```

---

### Step 3: Set Up Your Weekly Availability

#### Option A: Set Availability During Service Creation

```
When creating the service:

For Week Availability:
├─ Click each day (Mon-Sun)
├─ Toggle "Enabled" or "Disabled"
├─ If enabled, set:
│  ├─ Start Time (e.g., 09:00)
│  └─ End Time (e.g., 17:00)
└─ System will auto-generate 60-min slots (or your duration)

Example:
Monday:    ✅ Enabled  09:00 - 17:00  → Creates slots: 9:00-10:00, 10:00-11:00, etc.
Tuesday:   ✅ Enabled  09:00 - 17:00  → Creates slots similarly
Wednesday: ✅ Enabled  09:00 - 12:00  → Creates morning slots only
Thursday:  ❌ Disabled             → No slots this day
Friday:    ✅ Enabled  14:00 - 18:00  → Afternoon only
Sat-Sun:   ❌ Disabled             → No slots
```

#### Option B: Set Availability Anytime (Main "Set Your Availability" Button)

```
Location: Services dashboard → "Set Your Availability" button (blue button top-right)

When you click it, you can:

1. View your weekly schedule grid (Mon-Sun)
2. Enable/Disable each day
3. Adjust start/end times per day
4. See how many days you're available (/7 badge)
5. Save changes

All consulting slots are generated from this schedule!
```

#### Understanding the Slot Generation Algorithm

Once you set up your weekly availability, Specialistly automatically creates appointment slots:

```
Example: Monday 09:00-17:00, service duration 60 minutes

System generates:
9:00-10:00  ✅ Available (customer can book)
10:00-11:00 ✅ Available
11:00-12:00 ✅ Available
12:00-13:00 ✅ Available
13:00-14:00 ✅ Available
14:00-15:00 ✅ Available
15:00-16:00 ✅ Available
16:00-17:00 ✅ Available

Total: 8 slots for Monday

When customer books 1 slot:
9:00-10:00  ❌ BOOKED
10:00-11:00 ✅ Still available
... (rest available)

When all slots booked:
All Monday slots become ❌ BOOKED (customer sees "No availability")
```

**Key Points:**
- Slots are generated based on `sessionDuration` you set
- System respects `minBookingNotice` (default: 24 hours) - can't book last-minute
- System respects `maxAdvanceBooking` (default: 90 days) - can only book within 90 days

---

### Step 4: Create/Activate Your Service

#### Create New Service Dialog

```
Fill all fields:
☐ Service Title
☐ Description  
☐ Price ($)
☐ Session Duration (minutes)
☐ Weekly Availability (enable days + times)

Then: Click "Create Service" button
```

#### After Creation - Activate Service

The service is created in **Draft** status. To make it available for booking:

```
1. Find your service in the Services list
2. Look for: Draft ← Status badge
3. Click the "Activate" button on the service card
   OR go to 3-dot menu → "Activate"

Status changes: Draft → Active
Result: All available slots are now bookable!
```

**What happens when you activate:**
```
✅ Service becomes visible to customers
✅ Appointment slots are generated from your weekly schedule
✅ Slots appear on customer's marketplace
✅ Customers can see your profile, read your bio, see your rates
✅ They can book any available time slot
```

---

## 🗓️ Availability Options Explained

### Option 1: Weekly Recurring (⭐ Recommended)

**Best for:** Regular ongoing consulting
**How it works:** System auto-generates slots every week based on your schedule

```
Setup:
Monday-Friday: 9:00 AM - 6:00 PM
Saturday:      2:00 PM - 5:00 PM
Sunday:        Off

Result:
Week 1: 25+ slots generated (Mon-Fri: 9h × 60min = slots, Sat: 3h = 3 slots)
Week 2: 25+ slots generated (auto-repeats)
Week 3: 25+ slots generated (continues indefinitely)
...

Customers see: Weekly recurring availability
Benefits:
✅ Set once, works forever
✅ Consistent schedule
✅ No manual slot creation
✅ Easy for customers to predict availability
```

**How to set up:**
```
Create Service → Availability Type: "Weekly"

Toggle each day you work:
☑ Monday   09:00 - 18:00
☑ Tuesday  09:00 - 18:00
☑ Wednesday 09:00 - 18:00
☑ Thursday 09:00 - 18:00
☑ Friday   09:00 - 18:00
☐ Saturday (disabled)
☐ Sunday   (disabled)

Save → Done! Slots auto-generate
```

---

### Option 2: Single Day/Custom Schedule

**Best for:** Limited availability, special offers, or specific days

```
Setup:
Special week for Q1 workshops:
Feb 20: 10:00 AM - 12:00 PM (6 spots for 20-min sessions)
Feb 21: 10:00 AM - 12:00 PM
Feb 22: 10:00 AM - 12:00 PM

Result:
Only these 3 days are available
Total: 18 slots (6 per day × 3 days)
After Feb 22: No more availability (no weekly recurrence)

Benefits:
✅ Full control over when you work
✅ Great for limited-time offers
✅ Flexible scheduling
```

**How to set up:**
```
Create Service → Availability Type: "Single Day"
              OR "Custom"

Add specific dates:
+ Feb 20 → 10:00 AM - 12:00 PM
+ Feb 21 → 10:00 AM - 12:00 PM
+ Feb 22 → 10:00 AM - 12:00 PM

Save → Slots created only for these dates
```

---

## 📊 Slot Management

### View Your Slots

**Location:** Services → [Your Service] → "View Slots" or "Bookings" tab

```
You'll see:

Available Slots:
├─ Monday, Feb 19, 9:00-10:00 AM ✅ Available
├─ Monday, Feb 19, 10:00-11:00 AM ✅ Available
├─ Monday, Feb 19, 11:00 AM-12:00 PM ✅ Available
└─ ... (more slots)

Booked Slots:
├─ Monday, Feb 19, 2:00-3:00 PM ❌ Booked by: john@email.com
├─ Tuesday, Feb 20, 9:00-10:00 AM ❌ Booked by: sarah@email.com
└─ ... (more bookings)

Upcoming Bookings:
├─ David Johnson - Monday 3/5 at 2:00 PM
├─ Sarah Chen - Wednesday 3/7 at 10:00 AM
└─ ... (upcoming sessions)
```

### Edit Slots/Availability

**To change your availability:**

```
1. Go to Services → "Set Your Availability" button

2. Modify your schedule:
   ├─ Enable/disable days
   ├─ Adjust start/end times
   └─ Save changes

3. System updates existing slots:
   ✅ New slots created if you expanded hours
   ❌ Slots removed if you reduced hours (unless booked)
   ⚠️ Booked slots cannot be deleted (must reschedule customers)
```

**Cannot edit booked slots directly:**
```
Why? Because a customer has already committed!

To free up a booked slot:
1. Contact the customer
2. Agree on new time
3. Create new slot at new time
4. Customer books new slot
5. Reschedule old booking

OR approve their cancellation if they request
```

### Cancel/Delete Slots

**Deleting Available Slots:**
```
✅ You CAN delete slots with status "Available"

How:
1. Find the slot in your list
2. Click trash/delete icon
3. Confirm deletion
4. Slot removed

Impact: Customers no longer see this slot
```

**Avoiding Cancellations:**
```
Instead of deleting slots:

For time off:
├─ Set "Block Time" feature (if available)
│  └─ Marks slots as "unavailable" temporarily
└─ Or disable days in Weekly Availability

For permanently changing schedule:
├─ Edit Weekly Availability
└─ System will adjust future slots accordingly

For vacation:
├─ Disable all days for that week
├─ Slots auto-remove from future
└─ No customer impact (they can't see them)
```

---

## 🔄 Workflow: From Setup to Booking

### Complete Customer Journey

```
┌─────────────────────┐
│  YOU (Specialist)   │
│                     │
│  1. Create Service  │  "Career Mentoring, $50/30min"
│     Set Availability│  "Mon-Fri 9-5"
│     Activate        │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────────┐
    │ SLOTS GENERATED  │
    │                  │
    │ Week 1: 40 slots │
    │ Week 2: 40 slots │
    │ Week 3: 40 slots │
    │ ...              │
    └──────────┬───────┘
               │
               ↓
    ┌──────────────────────────┐
    │  CUSTOMER DISCOVERS YOU  │
    │                          │
    │ Sees in "Browse Experts" │
    │ Reads your profile       │
    │ Checks your rate         │
    │ Views availability       │
    └──────────┬───────────────┘
               │
               ↓
          ✅ YES, I want to book!
               │
               ↓
    ┌──────────────────────────┐
    │  CUSTOMER BOOKS SLOT     │
    │                          │
    │ Select date/time         │
    │ Add meeting notes        │
    │ Pay $50                  │
    │ Book confirmed           │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │  YOU GET NOTIFICATION    │
    │  (Email + Dashboard)     │
    │                          │
    │ "New Booking: Sarah J."  │
    │ "Monday 2/19 at 2:00 PM" │
    │ "Career mentoring session"│
    │ "Starting in 3 days"     │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │  AUTOMATED REMINDERS     │
    │                          │
    │ Customer: 24h before     │
    │ You: 2h before           │
    │ Zoom link sent           │
    └──────────┬───────────────┘
               │
               ↓
         🎥 SESSION STARTS
         📹 Zoom call recorded
         ✅ Session completed
               │
               ↓
    ┌──────────────────────────┐
    │  AFTER SESSION           │
    │                          │
    │ Recording link sent      │
    │ Customer can review      │
    │ Customer leaves review   │
    │ Payment processed        │
    │ 80% goes to you! 💰      │
    └──────────────────────────┘
```

---

## 🛠️ Advanced Features

### Time Buffers Between Sessions

```
Problem: You want 15 minutes between sessions to take notes

Solution: Set buffer in booking rules
├─ Min booking notice: 24 hours
├─ Buffer between slots: 15 minutes
└─ System won't allow back-to-back bookings

Result:
9:00-10:00: Session with John
10:00-10:15: BLOCKED (buffer time)
10:15-11:15: Available for next booking
```

### Timezone Handling

```
You: Based in New York (EST)
Customer: Based in London (GMT)

System automatically:
✅ Stores all times in UTC (database)
✅ Displays times based on customer's timezone
✅ Shows customer: "3:00 PM London time"
✅ Shows you: "10:00 AM New York time"
✅ Sets Zoom meeting for exact same moment

No confusion about timezone differences!
```

### Recurring Availability vs. Exceptions

```
Base Schedule:
Mon-Fri: 9 AM - 5 PM

Exceptions (special days):
├─ Feb 19 (Presidents Day): OFF
├─ Mar 20-24 (Conference): OFF or "Limited 6-8 PM only"
└─ Apr 15: OFF

System:
✅ Creates slots normally for regular days
❌ Skips dates in exceptions
✅ OR creates limited slots if you specify custom hours
```

---

## ❓ FAQ

### Q1: When do customers see my slots?

**A:** Immediately after you:
1. ✅ Create consulting service
2. ✅ Set your weekly availability
3. ✅ Click "Activate" on the service

Customers can now browse your profile in the marketplace and see available times.

---

### Q2: How far in advance can customers book?

**A:** Default: 90 days (configurable)

```
Today: March 1
Customers can book: March 1 - May 30 (90 days out)
Cannot book: June 1 onwards

As time passes, more future dates open up
```

---

### Q3: Can I prevent last-minute bookings?

**A:** Yes! Via "Min Booking Notice"

Default: 24 hours

```
If set to 24 hours:
├─ Today is Monday 9:00 AM
├─ Customers can book: Tuesday 9:00 AM onwards
├─ Cannot book: Today's afternoon slots
└─ This gives you notice to prepare

You can set to 48 hours or even 1 week if needed
```

---

### Q4: What if I need to block time off?

**A:** Disable days in "Set Your Availability"

```
Option 1: Vacation - Disable all days
Mon-Sun: ❌ Disabled
Result: No slots available for that week
    
Option 2: Partial day - Edit hours
Monday: 9:00 AM - 12:00 PM (afternoon off)
Result: Only morning slots available

Option 3: Date exception - Set specific dates as OFF
Mar 20-23: OFF (conference)
Result: No slots for those dates despite weekly schedule being Mon-Fri
```

---

### Q5: Can I change prices for existing services?

**A:** Yes, anytime!

```
Go to: Services → [Service] → Edit

Edit: Price field
Update: $50 → $75

Apply to:
✅ New bookings use new price ($75)
❌ Existing bookings keep original price ($50)

Customers see new price when browsing
```

---

### Q6: What's the difference between "Booked" and "Completed"?

**A:** Timeline status

```
Available → Customer Books → Booked → Session Happens → Completed

Booked: Confirmed, but session hasn't happened yet
Completed: Session already happened, recording available

Your Dashboard shows:
├─ Bookings: Sessions coming up (booked but not happened)
├─ Completed: Sessions that already happened
└─ Revenue: From completed sessions
```

---

### Q7: Can I have different prices for different durations?

**A:** Currently (Specialistly MVP):
- One price per service
- Multiple durations possible via multiple services

```
Create 2 services:
├─ "Quick Consult" 30 min @ $35
└─ "Full Session" 60 min @ $60

Future enhancement: Duration-based pricing
├─ 30 min @ $35
├─ 60 min @ $60
└─ 90 min @ $85
```

---

### Q8: How do I handle no-shows?

**A:** Post-session

```
After session time:
1. Check if customer attended
2. If not, mark as "No-show"
3. You can:
   ├─ Offer reschedule
   ├─ Keep payment (policy-dependent)
   └─ Note it for future bookings
```

---

### Q9: Do I have to use Zoom for video?

**A:** Yes (for now)

Specialistly integrates with Zoom for:
- ✅ Automatic meeting creation
- ✅ Unique join URLs per session
- ✅ Automatic recording
- ✅ Participant tracking

Future: May add Google Meet, Microsoft Teams

---

### Q10: What if no one books my slots?

**A:** That's normal! Access recommendations:

```
1. Complete Your Profile
   ├─ Add profile picture
   ├─ Write compelling bio
   └─ Highlight credentials

2. Competitive Pricing
   ├─ Research similar consultants
   ├─ Price competitively
   └─ Consider introductory rates

3. Promotion
   ├─ Share profile link on social media
   ├─ Network with potential clients
   ├─ Guest blog feature specialists
   └─ Email your existing network

4. Service Quality
   ├─ Deliver excellent sessions
   ├─ Get positive reviews
   ├─ Build reputation over time

5. Increase Availability
   ├─ More time slots available = higher visibility
   ├─ Try different times  (evenings, weekends?)
   └─ Expand your working hours gradually
```

---

## 📞 Support & Next Steps

### Getting Help

If you have questions:
1. Check [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Backend implementation details
2. Review [COMPLETE_API_REFERENCE.md](COMPLETE_API_REFERENCE.md) - Slot creation/management APIs
3. Check [CONSULTING_PLATFORM_ARCHITECTURE.md](CONSULTING_PLATFORM_ARCHITECTURE.md) - Full system design

### Backend APIs Powering This

For developers, the technical side uses:

**Create Availability Schedule:**
```
POST /api/availability/schedule
Request: {
  specialistId: "...",
  weeklyPattern: { ... },
  timezone: "America/New_York"
}
```

**Generate Slots from Schedule:**
```
POST /api/slots/generate
Request: {
  availabilityScheduleId: "...",
  startDate: "2024-02-19",
  endDate: "2024-05-19"
}
Result: 40+ appointment slots created
```

**Get Available Slots for Customer:**
```
GET /api/slots/available?specialistId=...
Returns: [
  { id: "...", date: "2024-02-19", startTime: "09:00", endTime: "10:00", ... },
  { id: "...", date: "2024-02-19", startTime: "10:00", endTime: "11:00", ... },
  ...
]
```

---

## ✨ Best Practices

### 1. **Set Realistic Availability**
```
❌ Don't: Set 8-8 seven days a week (burnout risk)
✅ Do: Set hours you'll actually keep (e.g., 9-5 Mon-Fri)
```

### 2. **Block Time for Prep & Admin**
```
❌ Don't: Back-to-back sessions all day
✅ Do: Leave 30 min between sessions for notes, breaks
```

### 3. **Start Conservative**
```
❌ Don't: Set 6 hours/day availability immediately
✅ Do: Start with 2-3 hours/day, expand as demand grows
```

### 4. **Give Adequate Notice Time**
```
❌ Don't: Allow bookings same-day (too stressful)
✅ Do: Require 24-48h notice before meeting
```

### 5. **Be Consistent**
```
❌ Don't: Change availability weekly
✅ Do: Keep schedule stable for at least a month, then adjust
```

### 6. **Price for Value**
```
❌ Don't: Under-price your expertise
✅ Do: Price competitively based on experience and market
```

---

## 🎓 Example Setups

### Example 1: Full-Time Consultant

```
Status: Professional consultant, multiple requests expected

Schedule:
├─ Monday-Friday: 8:00 AM - 6:00 PM
├─ Saturday: 10:00 AM - 2:00 PM
├─ Sunday: Off

Service:
├─ Title: "Business Strategy Consulting"
├─ Price: $150/session
├─ Duration: 60 minutes
├─ Type: Consulting

Availability: 
├─ ~50 slots/week generated
├─ Min booking notice: 24 hours
├─ Max advance: 90 days

Expected:
✅ Multiple bookings per week
✅ Strong income potential
✅ Professional schedule
```

### Example 2: Side Hustle Consultant

```
Status: Part-time, passionate about helping

Schedule:
├─ Monday: 6:00 PM - 8:00 PM
├─ Wednesday: 6:00 PM - 8:00 PM
├─ Saturday: 10:00 AM - 12:00 PM
├─ Sunday: 10:00 AM - 1:00 PM

Service:
├─ Title: "Career Guidance (30-min)"
├─ Price: $35/session
├─ Duration: 30 minutes
├─ Type: Consulting

Availability:
├─ ~12 slots/week
├─ Min booking notice: 48 hours
├─ Max advance: 60 days

Expected:
✅ 5-10 bookings/month
✅ Flexible around day job
✅ Build side income
```

### Example 3: Limited Availability Specialist

```
Status: High-demand expert, limited availability

Schedule:
├─ Thursday: 2:00 PM - 6:00 PM
├─ Friday: 2:00 PM - 6:00 PM
├─ Saturday: 10:00 AM - 4:00 PM

Service:
├─ Title: "Executive Coaching (90-min)"
├─ Price: $300/session
├─ Duration: 90 minutes
├─ Type: Consulting

Availability:
├─ ~8 slots/week
├─ Min booking notice: 1 week
├─ Max advance: 30 days

Expected:
✅ Selective, high-value clients
✅ Premium pricing
✅ Exclusive positioning
```

---

## 📈 Growth Roadmap

### Month 1: Launch
- [ ] Create 1-2 consulting services
- [ ] Set weekly availability (realistic hours)
- [ ] Activate services
- [ ] Get first 5 bookings
- [ ] Deliver excellent sessions
- [ ] Collect 5-star reviews

### Month 2: Optimize
- [ ] Adjust pricing based on demand
- [ ] Expand availability if booking well
- [ ] Refine your service offerings
- [ ] Target 10-15 bookings
- [ ] Aim for 4.8+ star rating

### Month 3: Scale
- [ ] Launch second service variation
- [ ] Consider premium/package pricing
- [ ] Expand hours or add weekends
- [ ] Target 20+ bookings
- [ ] Build waitlist if fully booked

### Quarter 2+: Grow
- [ ] Leverage reviews for marketing
- [ ] Consider group workshops
- [ ] Add complementary services
- [ ] Scale to consistent 20+ monthly bookings
- [ ] Consider "expert" status on platform

---

## 🎉 Ready to Launch?

1. ✅ Go to Dashboard → Services
2. ✅ Click "+ New Service"
3. ✅ Choose "Consulting"
4. ✅ Fill in your details
5. ✅ Set your weekly availability
6. ✅ Click "Create Service"
7. ✅ Find service → Click "Activate"
8. ✅ Done! Your slots are live!

**Your first customer booking could happen today!** 🚀

---

**Questions?** Check the comprehensive [CONSULTING_PLATFORM_ARCHITECTURE.md](CONSULTING_PLATFORM_ARCHITECTURE.md) for system design details or [COMPLETE_API_REFERENCE.md](COMPLETE_API_REFERENCE.md) for technical API specs.
