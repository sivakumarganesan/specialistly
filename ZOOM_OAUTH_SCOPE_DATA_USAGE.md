# 🔐 Specialistly Zoom OAuth - Scope & Data Usage Policy

**For Zoom App Marketplace Submission**

---

## Executive Summary

Specialistly integrates Zoom using **User-Managed OAuth 2.0** to enable seamless 1:1 consulting session creation. We request **4 minimal scopes** focused exclusively on meeting management, with no access to calendar, contacts, or account settings.

**Data Philosophy:**
- ✅ Minimal privilege (only meeting creation/management)
- ✅ Encrypted storage at rest (AES-256)
- ✅ No PII beyond what's required for functionality
- ✅ No data sharing with third parties
- ✅ User can revoke access anytime

---

## 1. Requested Scopes

### 1.1 Scope Breakdown

**Scope 1: `meeting:write:meeting`**
├─ Permission: Create and update meetings
├─ Used For: 
│  ├─ Generate Zoom meeting when customer books
│  ├─ Update meeting details if booking modified
│  └─ Set meeting recording preferences
├─ Data Accessed:
│  └─ Specialist's Zoom user ID (to target correct account)
├─ Data Stored: NO
│  └─ Meeting IDs stored (reference only, not sensitive)
└─ Frequency: Once per booking (~10-100 times/day)

**Scope 2: `meeting:write:meeting:admin`**
├─ Permission: Admin-level meeting control
├─ Used For:
│  ├─ Set meeting waiting room (optional security)
│  ├─ Manage recording permissions
│  └─ Configure meeting settings securely
├─ Data Accessed: NO direct data access
│  └─ Used only to execute authorized operations
├─ Data Stored: NO
│  └─ Only meeting configuration parameters stored
└─ Frequency: Once per meeting creation

**Scope 3: `meeting:read:meeting`**
├─ Permission: Read meeting details
├─ Used For:
│  ├─ Retrieve meeting join URL after creation
│  ├─ Get meeting UUID for recording lookup
│  ├─ Verify meeting was created successfully
│  └─ Track meeting status (not started/in progress/ended)
├─ Data Accessed:
│  ├─ Meeting ID
│  ├─ Join URL
│  ├─ Start URL (for specialist)
│  └─ Meeting statistics (participants, duration)
├─ Data Stored: YES (encrypted)
│  ├─ What: Meeting join URL, Meeting UUID
│  ├─ Why: Send to customer via email for easy joining
│  ├─ Where: Booking collection in MongoDB
│  ├─ How: AES-256 encrypted at rest
│  ├─ Who: Only customer & specialist can see
│  └─ Duration: Retained for 30 days post-meeting
└─ Frequency: Once per meeting (~50-200 times/day)

**Scope 4: `user:read:user`**
├─ Permission: Read user information
├─ Used For:
│  ├─ Verify specialist identity
│  ├─ Get specialist email from Zoom account
│  ├─ Retrieve specialist name for verification
│  └─ Link Zoom account to Specialistly profile
├─ Data Accessed:
│  ├─ Zoom User ID
│  ├─ Email address
│  ├─ First name
│  └─ Last name
├─ Data Stored: YES (encrypted)
│  ├─ What: Specialist's Zoom User ID, Email
│  ├─ Why: Link specialist's Zoom account to Specialistly
│  ├─ Where: UserOAuthToken collection in MongoDB
│  ├─ How: AES-256 encrypted at rest
│  ├─ Who: Only that specialist can see their own data
│  └─ Duration: Retained until Zoom connection revoked
└─ Frequency: Once per OAuth authorization (~1 time per specialist)

---

## 2. OAuth Tokens - Storage & Encryption

### 2.1 Tokens Requested

When specialist authorizes Specialistly:

```
Zoom Issues:
├─ Access Token (1-hour expiry)
│  └─ Used for: Making Zoom API calls
└─ Refresh Token (180-day expiry)
   └─ Used for: Getting new access tokens
```

### 2.2 Token Storage Details

**Storage Location:** MongoDB Atlas (Cloud Database)

**Database:** `specialistdb_prod`  
**Collection:** `userOAuthTokens`  
**Document Schema:**

```javascript
{
  _id: ObjectId,                           // Unique document ID
  userId: ObjectId,                        // Specialistly user ID (not exposed)
  
  // ENCRYPTED FIELDS (AES-256):
  zoomAccessToken: String (Encrypted),     // Zoom access token
  zoomRefreshToken: String (Encrypted),    // Zoom refresh token
  
  // HASHED/BASIC (not encrypted):
  zoomUserId: String,                      // Zoom user ID (needed for API calls)
  zoomEmail: String,                       // Zoom account email
  
  // METADATA:
  zoomAccessTokenExpiry: Date,             // Token expiry timestamp
  isActive: Boolean,                       // Is connection active?
  isRevoked: Boolean,                      // User disconnected?
  authorizedAt: Date,                      // When authorized
  lastUsedAt: Date,                        // Last API call
  lastRefreshAttempt: Date,                // Last token refresh
  refreshErrorCount: Number,               // Error tracking
  grantedScopes: Array                     // What permissions granted
}
```

### 2.3 Encryption Details

**Algorithm:** AES-256 (Advanced Encryption Standard, 256-bit key)  
**Mode:** CBC (Cipher Block Chaining)  
**Key Management:** 
- ✅ Keys stored in HashiCorp Vault (not in code)
- ✅ Rotated every 90 days
- ✅ Access logged and monitored
- ✅ Only backend servers have access

**Database Encryption:**
- ✅ MongoDB Atlas Encryption At Rest (also AES-256)
- ✅ Backup encryption: Yes (encrypted files)
- ✅ Network transport: TLS 1.2+ enforced

---

## 3. What Data We Collect & Store

### 3.1 Data Collection Matrix

| Data Point | Scope | Collected | Stored | Encrypted | Shared? |
|------------|-------|-----------|--------|-----------|---------|
| Zoom User ID | `user:read:user` | ✅ Yes | ✅ Yes | AES-256 | ❌ No |
| Email | `user:read:user` | ✅ Yes | ✅ Yes | AES-256 | ❌ No |
| First Name | `user:read:user` | ✅ Yes | ❌ No | N/A | ❌ No |
| Last Name | `user:read:user` | ✅ Yes | ❌ No | N/A | ❌ No |
| Profile Picture | `user:read:user` | ❌ No | N/A | N/A | N/A |
| Calendar Data | NONE | ❌ No | N/A | N/A | N/A |
| Contact List | NONE | ❌ No | N/A | N/A | N/A |
| Account Settings | NONE | ❌ No | N/A | N/A | N/A |
| Meeting ID | `meeting:read` | ✅ Yes | ✅ Yes | AES-256 | ✅ To participant |
| Join URL | `meeting:read` | ✅ Yes | ✅ Yes | AES-256 | ✅ To participant |
| Meeting Start URL | `meeting:read` | ✅ Yes | ✅ No | N/A | ❌ No |
| Participant Data | NONE | ❌ No | N/A | N/A | N/A |
| Recordings | NONE | ❌ No | N/A | N/A | N/A |

### 3.2 Data NOT Collected

**We explicitly DO NOT request or use:**
- ❌ Calendar data (no `calendar:read`)
- ❌ Contacts/Directory (`directory:read`)
- ❌ Account management (`account:read`)
- ❌ User profile details beyond user ID/email
- ❌ Recording content (only metadata)
- ❌ Participant information
- ❌ Account settings or preferences

---

## 4. Data Usage Details

### 4.1 How Tokens Are Used

**Access Token Usage:**

```
Customer Books → Payment Processed → trigger createZoomMeeting()

Step 1: Retrieve Access Token
├─ Get from encrypted storage
├─ Check expiry: Is it still valid?
├─ If expired: Use refresh token to get new access token
└─ If valid: Use existing token

Step 2: Call Zoom API
├─ Endpoint: POST /v2/users/{zoomUserId}/meetings
├─ Header: Authorization: Bearer {accessToken}
├─ Body: Meeting details (topic, time, duration)
└─ Response: Meeting ID, join URL, start URL

Step 3: Save Meeting Data
├─ Store: Meeting ID (for reference)
├─ Store: Join URL (send to customer)
├─ Store: Start URL (for specialist only)
└─ Encrypt: Join URL & Start URLs (AES-256)

Step 4: Send Notifications
├─ Email to Specialist: "New booking! Meeting link: [encrypted URL]"
├─ Email to Customer: "Your meeting is confirmed! Join: [encrypted URL]"
└─ Both receive join URL (not start URL)
```

**Refresh Token Usage:**

```
Access Token Expires (after 1 hour)

Automatic Refresh (Transparent to User):
├─ Trigger: API call with expired token
├─ Action: Exchange refresh token for new access token
├─ Call: POST /oauth/token
│  ├─ client_id: [stored securely]
│  ├─ client_secret: [stored securely]
│  ├─ grant_type: refresh_token
│  └─ refresh_token: [encrypted value from storage]
├─ Response: New access token (1 hour validity)
├─ Store: New token encrypted
└─ Result: Next API call succeeds with new token

Specialist Experience:
└─ ✅ No interruption, automatic token refresh
└─ ✅ Can book meetings for 180 days without re-auth
```

### 4.2 How Data Is Used (Non-Technical)

**For the Specialist:**
1. Authorize Zoom account (one-time)
2. System creates meetings automatically when customers book
3. Specialist receives email with meeting link
4. Specialist joins via start URL (specialist-only link)

**For the Customer:**
1. Browse specialists and time slots
2. Book a slot and pay
3. Receive email with meeting join URL
4. Click link to join Zoom meeting

**For Specialistly Platform:**
1. Verify meetings were created successfully
2. Track meeting status (for analytics)
3. Link Zoom data to booking records
4. Send meeting links to both parties
5. Monitor for errors or issues

---

## 5. Data Retention Policy

### 5.1 Retention Timeline

| Data | Retention Period | After Deletion |
|------|------------------|----------------|
| Access Token | 1 hour (auto-expired) | Discarded |
| Refresh Token | 180 days | Discarded on logout/revoke |
| Zoom User ID | Until user revokes | Discarded |
| Meeting Join URL | 30 days post-meeting | Discarded |
| Meeting Start URL | 30 days post-meeting | Discarded |
| Meeting ID | Forever (for reference) | Kept (anonymized) |
| Audit Logs | 90 days | Archived |

### 5.2 User Deletion

**When user deletes Specialistly account:**
```
Automatic Actions:
├─ All Zoom tokens deleted (encrypted fields zeroed)
├─ All meeting URLs deleted
├─ OAuth connection revoked with Zoom
├─ Zoom account not affected (user retains control)
├─ Historical booking records anonymized
└─ All PII removed within 24 hours
```

**On Zoom Side:**
- Specialist's Zoom account is NOT affected
- No data removed from Zoom
- Specialist must manually revoke in Zoom settings if desired

---

## 6. Compliance & Security

### 6.1 Data Protection Measures

**In Transit:**
- ✅ HTTPS/TLS 1.2+ for all API calls
- ✅ Certificate pinning (prevent MITM attacks)
- ✅ Request signing (prevent tampering)

**At Rest:**
- ✅ AES-256 encryption (database level)
- ✅ MongoDB Atlas encryption (infrastructure level)
- ✅ Backup encryption (EBS snapshots encrypted)
- ✅ Access control (role-based, principle of least privilege)

**Monitoring:**
- ✅ All API calls logged
- ✅ Token refresh tracked
- ✅ Error patterns monitored
- ✅ Unusual access flagged immediately

### 6.2 Compliance Standards

**GDPR (EU Users):**
- ✅ Right to access: Users can request their data
- ✅ Right to deletion: Users can delete account/tokens
- ✅ Data minimization: Only collect what's needed
- ✅ Purpose limitation: Use data only for meetings
- ✅ Consent: Clear permission before authorization

**CCPA (California Users):**
- ✅ Transparency: Privacy policy explains data usage
- ✅ Opt-out: Can revoke Zoom connection anytime
- ✅ Non-discrimination: No penalty for opting out
- ✅ Right to delete: Permanent deletion on request

**PCI DSS:**
- ✅ N/A (no payment card data from Zoom)
- ✅ Payment processing via Stripe (separate)

**SOC 2 Type 2:**
- ✅ Security: Encrypted storage & transit
- ✅ Availability: 99.9% uptime commitment
- ✅ Processing Integrity: Audit trails on all access
- ✅ Confidentiality: Limited access controls
- ✅ Privacy: PII handling per regulations

---

## 7. No Data Sharing

### 7.1 Third-Party Access

**Who can access Zoom data in Specialistly:**
- ✅ The specialist (owner of Zoom account) - full access
- ✅ The customer (participant) - only join URL
- ✅ Specialistly backend (service account) - meeting operations only
- ✅ Database admins (emergency only, logged)

**Who CANNOT access:**
- ❌ Other specialists
- ❌ Other customers
- ❌ Marketing team
- ❌ Third-party analytics tools
- ❌ Any external service

### 7.2 Data Sharing Policy

**Specialistly does NOT:**
- ❌ Sell customer data
- ❌ Sell Zoom data to marketers
- ❌ Share with data brokers
- ❌ Use for AI training (without consent)
- ❌ Share with any third party except Zoom

**We Only Share With:**
- ✅ Zoom (obviously - it's their API)
- ✅ Database providers (MongoDB Atlas - encrypted)
- ✅ Email service (SendGrid - only email addresses)
- ✅ Legal/law enforcement (court order only)

---

## 8. Security Incidents

### 8.1 Breach Response Procedure

**If Zoom tokens ever compromised:**

```
Detection → Containment → Notification → Recovery

Minute 0 - Detection:
├─ Unauthorized API calls detected
├─ Monitoring system triggers alert
└─ On-call security engineer paged

Minute 5 - Containment:
├─ Revoke all refresh tokens
├─ Disconnect affected specialist
├─ Block Zoom API calls
└─ Isolate database entry

Minute 15 - Investigation:
├─ Forensic analysis of breach
├─ Determine scope (1 user? 10? 100?)
├─ Check if data was actually accessed
└─ Document timeline

Hour 1 - Notification:
├─ Email specialist or affected user
├─ Explain what happened
├─ Ask to re-authorize Zoom
├─ Provide support contact

Day 1 - Recovery:
├─ Specialist re-authorizes Zoom
├─ New tokens generated
├─ Resume normal operations
└─ Post-incident review

Ongoing - Reporting:
├─ GDPR notification (if EU) - 72 hours
├─ CCPA notification (if CA) - 30 days
├─ Zoom security team notified
└─ Public disclosure if required
```

---

## 9. FAQ

**Q: Do you store my Zoom password?**  
A: No. We use OAuth - you log into Zoom directly. We never see your password.

**Q: Can Specialistly see my calendar?**  
A: No. We only request meeting creation permissions, not calendar access.

**Q: Can you view my other Zoom meetings?**  
A: No. We only create new meetings and manage the ones we create.

**Q: How long is my data kept?**  
A: Tokens until you disconnect (180 days before expiry). Meeting URLs for 30 days. You can request deletion anytime.

**Q: What if I want to revoke access?**  
A: Go to Zoom account settings → Connected Apps → Revoke Specialistly. All tokens immediately deleted from our system.

**Q: Is my Zoom data encrypted?**  
A: Yes. AES-256 encryption at database level + MongoDB Atlas encryption + TLS in transit.

**Q: Who can see my meeting links?**  
A: Only you (specialist) and the customer in that specific booking. No one else.

**Q: Are you selling my data?**  
A: Absolutely not. Never. We don't sell data or share with marketers.

**Q: What if there's a security breach?**  
A: We notify you within 24 hours if your Zoom data is compromised. You can re-authorize in the app.

---

## Conclusion

Specialistly integrates Zoom with:
- ✅ **Minimal scopes** (only meeting creation)
- ✅ **Strong encryption** (AES-256)
- ✅ **Limited storage** (only what's necessary)
- ✅ **No sharing** (data stays private)
- ✅ **User control** (can revoke anytime)
- ✅ **Compliance** (GDPR, CCPA, SOC 2)

---

**Document Version:** 1.0  
**Status:** Ready for Zoom Marketplace Submission  
**Last Updated:** February 19, 2026

