# Zoom Disconnect & Re-authorization Feature - User Guide

## 🎯 Feature Overview
Specialists can now disconnect and re-authorize their Zoom accounts directly from the Settings page. This allows them to update their authorization, fix connection issues, or switch Zoom accounts.

---

## 📍 Location in App
**Settings → User Profile Tab → Zoom Integration Section** (bottom of page)

---

## 🔄 When Zoom IS Connected

### UI Display
- **Green Status Card**: "✓ Zoom Account Connected"
- **Status Message**: "Your Zoom account is connected and ready to use. Meetings will be automatically created when participants book appointments."
- **Two Action Buttons**:

#### Button 1: Re-authorize (Purple)
- Use this if you want to update your Zoom authorization
- Restarts the OAuth flow without disconnecting
- Useful if your permission settings need updating
- Click → Redirects to Zoom OAuth authorization

#### Button 2: Disconnect Zoom (Red Outline)
- Use this if you want to fully disconnect your Zoom account
- Shows confirmation dialog: "Are you sure you want to disconnect your Zoom account? You can reconnect anytime."
- After disconnection:
  - Token is revoked in Zoom's system
  - All Zoom fields cleared from your profile
  - Success message appears: "✓ Zoom account disconnected successfully. You can reconnect anytime."
  - UI switches back to "Connect Zoom Account" button
- Click → Confirmation dialog → Revoke connection

---

## 🔗 When Zoom IS NOT Connected

### UI Display
- **Blue Information Card**: "Connect your Zoom account to enable video meeting creation for appointments and sessions."
- **Single Action Button**: "Connect Zoom Account" (Blue)
- Click → Redirects to Zoom OAuth authorization flow

---

## 📋 Step-by-Step: Re-authorize Zoom

### Scenario: Your Zoom permissions changed, want fresh authorization

1. Go to **Settings** page (left sidebar)
2. Ensure you're on the **"User Profile"** tab
3. Scroll to **"Zoom Integration"** section
4. You'll see green "✓ Zoom Account Connected" status
5. Click **"Re-authorize"** button (purple)
6. You'll be redirected to Zoom's authorization page
7. Review permissions and click "Authorize"
8. Return to Specialistly automatically
9. See updated green success status
10. ✅ Your Zoom account is re-authorized

---

## 📋 Step-by-Step: Disconnect Zoom

### Scenario: You want to remove Zoom integration or switch accounts

1. Go to **Settings** page (left sidebar)
2. Ensure you're on the **"User Profile"** tab
3. Scroll to **"Zoom Integration"** section
4. You'll see green "✓ Zoom Account Connected" status
5. Click **"Disconnect Zoom"** button (red outline)
6. **Confirmation Dialog** appears:
   - Message: "Are you sure you want to disconnect your Zoom account? You can reconnect anytime."
   - Two options: "Cancel" or "OK"
7. Click **"OK"** to confirm disconnection
8. Button shows loading state: "Disconnecting..."
9. After 1-2 seconds:
   - Success message: "✓ Zoom account disconnected successfully. You can reconnect anytime."
   - Green status card disappears
   - Blue "Connect Zoom Account" button appears
10. ✅ Your Zoom account is disconnected

---

## 📋 Step-by-Step: Connect Zoom (after disconnect)

### Scenario: You've disconnected and want to reconnect

1. Go to **Settings** page (left sidebar)
2. Ensure you're on the **"User Profile"** tab
3. Scroll to **"Zoom Integration"** section
4. You'll see blue card with "Connect Zoom Account" button
5. Click **"Connect Zoom Account"** (blue button)
6. Button shows loading state: "Connecting to Zoom..."
7. Redirected to Zoom's authorization page
8. Review permissions and click "Authorize"
9. Return to Specialistly automatically
10. Green status card appears: "✓ Zoom Account Connected"
11. ✅ Your Zoom account is reconnected

---

## 🔐 What Happens Behind the Scenes

### On Disconnect
1. ✅ Token is revoked in Zoom's system
2. ✅ UserOAuthToken record marked as revoked
3. ✅ Your User profile fields cleared:
   - `zoomConnected: false`
   - `zoomAccessToken: null`
   - `zoomRefreshToken: null`
   - `zoomAccountId: null`
   - `zoomConnectedAt: null`
4. ✅ No Zoom meetings can be created until reconnected

### On Re-authorization
1. ✅ Complete Zoom OAuth flow
2. ✅ New access & refresh tokens generated
3. ✅ UserOAuthToken record updated with new tokens
4. ✅ Your User profile marked as `zoomConnected: true`
5. ✅ Ready to create Zoom meetings immediately

---

## ⚠️ Important Notes

- **Non-destructive**: Disconnecting doesn't affect past meetings/recordings
- **Reversible**: You can reconnect anytime
- **Quick confirmation**: Confirmation dialog prevents accidental clicks
- **Auto-dismiss messages**: Success/error messages auto-dismiss after 3 seconds
- **Loading states**: Buttons show loading feedback during operations
- **Error handling**: Clear error messages if something goes wrong

---

## 🎬 Use Cases

### When to Re-authorize
✅ Zoom permissions changed  
✅ Want to add new scopes  
✅ Token seems to be expiring issues  
✅ Testing authorization  

### When to Disconnect
✅ Switching Zoom accounts  
✅ No longer using Zoom for meetings  
✅ Removing sensitive app access  
✅ Troubleshooting connection issues  
✅ Handing over to another specialist  

---

## ❓ FAQ

**Q: Will disconnecting delete my past Zoom meetings?**
A: No. Meetings already created remain in your Zoom account. Disconnecting only removes Specialistly's access.

**Q: Can I reconnect after disconnecting?**
A: Yes! You can disconnect and reconnect anytime. Just come back to Settings and click "Connect Zoom Account".

**Q: What if I accidentally disconnect?**
A: No problem! Just reconnect by clicking "Connect Zoom Account" and going through the OAuth flow again.

**Q: Will my customers be affected?**
A: If you disconnect before they book, no Zoom links will be created. Reconnect before new bookings to restore Zoom meeting creation.

**Q: How long does it take to reconnect?**
A: Usually 30 seconds. You'll be redirected to Zoom, authorize, and return automatically.

**Q: Can I switch Zoom accounts?**
A: Yes! Disconnect from the current account, then connect with a different Zoom account credentials.

---

## 🚀 Quick Reference

| Action | Button | Location | Result |
|--------|--------|----------|--------|
| **Connect Zoom** | Blue | Settings → Zoom Integration (when disconnected) | OAuth authorization |
| **Re-authorize** | Purple | Settings → Zoom Integration (when connected) | Fresh authorization |
| **Disconnect** | Red | Settings → Zoom Integration (when connected) | Token revoked, connection cleared |

---

## ✅ Status Indicators

- 🟢 **Green Status** = Zoom Connected and Ready
- 🔵 **Blue Card** = Ready to Connect Zoom
- 🔴 **Red Button** = Disconnect Option Available
- ⚪ **Spinning Icon** = Operation in Progress

---

**Last Updated:** January 30, 2026  
**Status:** ✅ Production Ready

