# Settings Page - Quick Test Guide

## 🚀 Quick Start

### Start the Application
```bash
# Terminal 1: Start Backend
cd c:\Work\specialistly\backend
node server.js

# Terminal 2: Start Frontend
cd c:\Work\specialistly
npm run dev
```

### Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

---

## 📋 Step-by-Step Test Scenarios

### Scenario 1: Create an Account

1. Go to http://localhost:5173
2. Click **Sign Up**
3. Enter credentials:
   - Email: `specialist@test.com`
   - Password: `Test@123`
4. Click **Sign Up**
5. ✅ Should redirect to Dashboard

---

### Scenario 2: Test User Profile

1. Click **Settings** in Sidebar
2. Click **User Profile** tab
3. **Test Photo Upload:**
   - Click the upload icon or avatar area
   - Select an image file (JPG/PNG/GIF)
   - ✅ Photo should display in avatar
   - ✅ Success message appears: "Photo updated..."

4. **Test Form Fields:**
   - Update Name: "John Specialist"
   - Update Email: "john@specialistly.com"
   - Update Phone: "+1 234 567 8900"
   - Update Bio: "Expert trainer with 10 years experience"
   - Update Location: "New York, NY"
   - Update Company: "Specialistly Academy"
   - Update Website: "https://johnspecialist.com"

5. **Test Save:**
   - Click **Save Changes**
   - ✅ Spinner should appear
   - ✅ Success message: "✓ Profile saved successfully!"
   - ✅ Message auto-clears after 3 seconds

6. **Test Reset:**
   - Make some changes to fields
   - Click **Reset**
   - ✅ Fields should revert to original values

7. **Test Validation:**
   - Clear Name field
   - Click Save Changes
   - ✅ Error message should appear: "Name and email are required"

8. **Test Persistence:**
   - Refresh the page (F5)
   - ✅ Saved data should still be there

---

### Scenario 3: Test Payment Settings

1. Click **Settings** in Sidebar
2. Click **Payment Settings** tab
3. **Test Payout Schedule:**
   - Dropdown shows: Daily, Weekly, Monthly
   - Select **Daily**
   - Click **Save Settings**
   - ✅ Success message appears: "✓ Payment settings saved successfully!"
   - ✅ Message auto-clears after 3 seconds

4. **Try Different Schedule:**
   - Select **Monthly**
   - Click Save
   - ✅ Another success message

---

### Scenario 4: Test Allotment Slots

1. Click **Settings** in Sidebar
2. Click **Allotment Slots** tab
3. **Test Availability Toggle:**
   - Monday, Tuesday, Wednesday, Thursday, Friday should be enabled (checked)
   - Saturday, Sunday should be disabled (unchecked)
   - Click checkbox for Saturday
   - ✅ Should enable, time inputs become active
   - Click again
   - ✅ Should disable, time inputs become grayed out

4. **Test Time Editing:**
   - Click on Monday start time
   - Change from 09:00 to 10:00
   - ✅ Time input should update
   - Click end time, change from 17:00 to 18:00

5. **Test Slot Duration:**
   - Dropdown shows: 15, 30, 60, 90, 120 minutes
   - Select 30 minutes
   - ✅ Should update without error

6. **Test Buffer Time:**
   - Dropdown shows: No buffer, 5, 10, 15, 30 minutes
   - Select 10 minutes
   - ✅ Should update without error

7. **Test Save:**
   - Click **Save Availability**
   - ✅ Spinner appears
   - ✅ Success message: "✓ Availability settings saved successfully!"
   - ✅ Message auto-clears

---

### Scenario 5: Test My Subscriptions

1. Click **Settings** in Sidebar
2. Click **My Subscriptions** tab
3. **Current Plan Display:**
   - ✅ Should show "Free Plan" as current (green badge)
   - ✅ Should show "Pro Plan" as available
   - ✅ Each plan shows features list

4. **Test Upgrade:**
   - On Free Plan card, click **Upgrade to Pro**
   - ✅ Button shows "Processing..." 
   - ✅ Button becomes disabled
   - ✅ Success message appears: "✓ Upgraded to Pro Plan successfully!"
   - ✅ Pro Plan now shows "Current Plan" badge
   - ✅ Free Plan now shows "Switch to Free" button

5. **Test Downgrade:**
   - On Pro Plan card, click **Cancel** (or **Switch to Free**)
   - ✅ Button shows "Processing..."
   - ✅ Success message: "✓ Switched to Free Plan successfully!"
   - ✅ Free Plan shows "Current Plan" badge again

6. **Test Message Auto-Clear:**
   - Perform an upgrade/downgrade
   - Watch message display
   - ✅ Message auto-clears after 3 seconds

---

## 🔍 Error Scenarios

### Test Invalid Input

1. **Clear Required Field:**
   - Go to User Profile
   - Clear the Name field
   - Click Save Changes
   - ✅ Error message appears: "Name and email are required"

2. **Missing Email:**
   - (System should prevent since we sync with auth context)
   - Error message: "Unable to determine your email address"

---

## 🎨 Visual Checks

- [ ] Colors are correct (purple theme)
- [ ] Cards display properly
- [ ] Buttons are clickable and change on hover
- [ ] Forms are readable and organized
- [ ] Messages display with correct color (green for success, red for error)
- [ ] Icons load correctly
- [ ] Responsive on mobile (open DevTools, toggle device toolbar)
- [ ] Responsive on tablet
- [ ] Responsive on desktop

---

## 📱 Mobile Testing

1. Open DevTools (F12)
2. Click toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12/14 resolution
4. Test all scenarios above
5. ✅ Should work perfectly on mobile

---

## ⚡ Performance Checks

1. Open DevTools → Network tab
2. Reload page
3. ✅ No red errors
4. ✅ All API calls return 200-201 status
5. ✅ Load time < 2 seconds

---

## 🔐 Security Checks

1. Check localStorage for token:
   - DevTools → Application → Local Storage
   - ✅ Should see `token` and `user` entries
   - ✅ Token should be JWT format (eyJ...)

2. Check API headers:
   - DevTools → Network → any API call
   - ✅ Should see `Authorization: Bearer <token>`

---

## ✅ Final Verification Checklist

### Frontend
- [ ] No console errors
- [ ] No console warnings
- [ ] All buttons clickable
- [ ] All forms functional
- [ ] All messages display
- [ ] Responsive design works
- [ ] localStorage has token
- [ ] Page refresh persists data

### Backend
- [ ] Server running on port 5001
- [ ] MongoDB connected
- [ ] All endpoints responding (200-201 status)
- [ ] No server errors in console

### Data Consistency
- [ ] Data saves to MongoDB
- [ ] Auth context updates on save
- [ ] localStorage updates with user data
- [ ] Refresh persists all changes

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to determine your email address"
- **Cause:** User not logged in or session expired
- **Solution:** Logout and login again

### Issue: "Failed to save: Connection refused"
- **Cause:** Backend server not running
- **Solution:** Start backend with `node server.js`

### Issue: Loading spinner doesn't stop
- **Cause:** API call timed out
- **Solution:** Check network tab in DevTools, check backend logs

### Issue: Photo doesn't upload
- **Cause:** File too large or invalid format
- **Solution:** Use JPG, PNG, or GIF under 5MB

### Issue: Changes don't persist on refresh
- **Cause:** API call failed silently
- **Solution:** Check browser console and network tab for errors

---

## 📞 Quick Commands

```bash
# Check backend is running
curl http://localhost:5001/api/health

# View backend logs
# Check the terminal where you ran "node server.js"

# Check frontend build
npm run build

# Clear browser cache
Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

# View React DevTools
# Install React DevTools browser extension

# Check TypeScript errors
npx tsc --noEmit
```

---

## ✨ Success Indicators

You'll know everything is working when:

1. ✅ Login and signup work without 404 errors
2. ✅ Settings page loads with all 4 tabs
3. ✅ Photo uploads and displays in avatar
4. ✅ Form data saves without errors
5. ✅ Subscription upgrade/downgrade works
6. ✅ Availability slots save successfully
7. ✅ Payment settings save successfully
8. ✅ All success messages appear and auto-clear
9. ✅ All error messages display correctly
10. ✅ Data persists after page refresh
11. ✅ No console errors or warnings
12. ✅ No TypeScript compilation errors

---

**Happy Testing! 🚀**

If you encounter any issues, check:
1. Backend server console for errors
2. Browser console (F12) for errors
3. Network tab (F12) for failed requests
4. MongoDB connection status in backend logs
