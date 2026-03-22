# PRIVACY POLICY

**Specialistly Inc.**

**Effective Date:** February 19, 2026  
**Last Updated:** February 19, 2026

---

## 1. Introduction

Specialistly Inc. ("**Company**," "**we**," "**us**," or "**our**") operates the Specialistly platform (the "**Service**"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, mobile application, and use our services, including when you interact with our third-party integrations like Zoom.

**Please read this Privacy Policy carefully.** If you do not agree with our policies and practices, please do not use our Service.

We are committed to protecting your privacy and ensuring you have a positive experience on our Service. This policy describes:
- What information we collect
- How we use your information
- Who we share your information with
- Your rights regarding your data
- How to contact us

---

## 2. Information We Collect

### 2.1 Information You Provide Directly

**Account Registration:**
- Full name
- Email address
- Password (hashed, never stored in plain text)
- Phone number (optional)
- Bio/professional description
- Profile photo
- Payment information (via Stripe - we don't store card details)

**Profile Information (Specialists):**
- Services offered
- Pricing and rates
- Availability schedule
- Professional credentials
- Location/timezone
- LinkedIn profile (optional)
- Website URL (optional)

**Booking Information (Customers):**
- Services booked
- Payment methods (processed by Stripe)
- Meeting dates and times
- Notes/messages to specialist

**Communications:**
- Emails you send us
- Messages through the platform
- Support tickets
- Feedback and surveys

**Zoom Integration:**
- Zoom User ID (stored encrypted)
- Zoom email address (stored encrypted)
- Zoom access tokens (stored encrypted, AES-256)
- Zoom refresh tokens (stored encrypted, AES-256)
- Meeting IDs created via Zoom (stored encrypted)
- Meeting join URLs (stored encrypted)
- Meeting metadata (duration, participants, status)

See [ZOOM_OAUTH_SCOPE_DATA_USAGE.md](ZOOM_OAUTH_SCOPE_DATA_USAGE.md) for complete Zoom data details.

### 2.2 Information Collected Automatically

**Device Information:**
- IP address
- Browser type
- Operating system
- Device type (mobile, desktop, etc.)
- Device identifier

**Usage Information:**
- Pages or features accessed
- Time spent on features
- Search queries
- Clicks and interactions
- Links clicked
- Referral source

**Location Information:**
- City/region (from IP address)
- Timezone (from settings)
- GPS (only with explicit permission)

**Cookies & Tracking:**
- Session cookies (maintain login)
- Preference cookies (save settings)
- Analytics cookies (understand usage)
- Third-party cookies (Zoom integration)

**Analytics:**
- Google Analytics (if enabled)
- Zoom analytics (meeting data)
- Hotjar (optional session recording)

### 2.3 Information from Third Parties

**Zoom:**
- User ID, email, name (when connecting account)
- Meeting metadata (when meetings created)

**Stripe:**
- Payment status
- Billing address
- Transaction history

**Email Services (SendGrid):**
- Email delivery status
- Open/click rates (anonymized)

**Verification Services:**
- Identity verification (if required for compliance)

---

## 3. How We Use Your Information

### 3.1 Primary Uses

**To Provide Services:**
- Create your account
- Display your services/profile
- Process bookings and payments
- Create Zoom meetings automatically
- Send meeting links and confirmations
- Facilitate communication between specialists and customers
- Process reviews and ratings
- Generate invoices and receipts

**To Communicate:**
- Send transactional emails (confirmations, reminders)
- Respond to support requests
- Send service announcements
- Share policy or ToS updates
- Request feedback

**To Improve Services:**
- Analyze usage patterns
- Identify popular services
- Fix bugs and errors
- Optimize performance
- Develop new features
- Monitor platform health

**For Security & Compliance:**
- Detect fraud and abuse
- Prevent unauthorized access
- Comply with legal obligations
- Enforce our Terms of Service
- Protect your rights and safety
- Audit and verify transactions

### 3.2 Marketing & Advertising

**With Your Consent Only:**
- Send marketing emails (opt-in)
- Share promotional content
- Show targeted ads (behavioral)
- Feature your profile (case studies)
- Include in testimonials

**You can opt-out anytime** by:
- Clicking unsubscribe in any email
- Updating notification preferences
- Contacting us directly

### 3.3 Legitimate Interests

We may use your information based on legitimate business interests:
- Fraud prevention and detection
- Platform security improvements
- Service optimization
- Legal compliance monitoring
- Business analytics

---

## 4. Data Retention

### 4.1 Retention Periods

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Active Account Data | While active | Operate service |
| Deleted Account Data | 30 days | Verify deletion, legal hold |
| Transaction History | 7 years | Tax, legal, disputes |
| Payment Records | 7 years | Tax records (IRS) |
| Zoom Tokens | 180 days | Token validity period |
| Zoom Meeting URLs | 30 days | Access recordings |
| Meeting Recordings | 1 year | User access, archival |
| Support Tickets | 2 years | Reference, disputes |
| Audit Logs | 90 days | Security monitoring |
| Email Communications | 1 year | Reference, disputes |
| Cookies | Until deleted | Session/preference |
| Analytics | 26 months | Google Analytics default |

### 4.2 Account Deletion

When you delete your Specialistly account:
- All personal information permanently deleted within 24 hours
- Zoom connection revoked (tokens deleted)
- Historical bookings anonymized (no PII remaining)
- Payment records retained 7 years (legal requirement)
- Cannot be reversed after 30-day grace period

---

## 5. How We Share Information

### 5.1 What We SHARE

**Customers Share:**
- Your services, pricing, availability (public profile)
- Your name and photo (to customers who book)
- Your email (for booking communication)
- Your Zoom join URL (when booking confirmed)

**Specialists Share:**
- Customer names (for meeting records)
- Customer email (for communications)
- Transaction data (payment receipt)

**Payment Processor (Stripe):**
- Name, email, address
- Payment method details
- Transaction amount
- Billing information

**Email Service (SendGrid):**
- Name, email address
- Service information (in emails sent)

**Analytics:**
- Non-personally identifiable usage data
- Aggregate trends (how many bookings, etc.)
- Performance metrics (page load times, etc.)

### 5.2 What We DON'T Share

❌ **We do NOT:**
- Sell personal data to marketers or brokers
- Share data for AI training (without explicit consent)
- Share with unrelated third parties
- Share Zoom tokens with anyone
- Share payment card details (Stripe handles this)
- Share with data brokers
- Use data for surveillance or profiling

### 5.3 Legal Requirements

We may disclose information if required by law:
- Court orders or subpoenas
- Government investigations
- Law enforcement requests
- To protect our legal rights
- To prevent fraud or abuse
- To protect user safety

---

## 6. Zoom-Specific Privacy

For complete Zoom privacy information, see [ZOOM_OAUTH_SCOPE_DATA_USAGE.md](ZOOM_OAUTH_SCOPE_DATA_USAGE.md)

### 6.1 Zoom OAuth

- **You Authorize Zoom:** When connecting account, you give Specialistly permission to access Zoom
- **Direct with Zoom:** Your Zoom account details are shared directly with Zoom (not through us)
- **We Store Tokens Encrypted:** OAuth tokens stored encrypted (AES-256) in MongoDB
- **We Don't Access Your Calendar:** We only create meetings, no calendar/contacts access
- **You Control:** Revoke Specialistly's access anytime via Zoom settings

### 6.2 Meeting Privacy

- **Specialist Controls:** Specialist owns the Zoom meeting (can record, edit settings)
- **Customer Gets Link:** Customer receives join URL via email (not start URL)
- **We Store URLs Encrypted:** Meeting URLs stored encrypted for 30 days
- **Recordings:** Stored in your Zoom account (not Specialistly)
- **We Don't Record:** Specialistly doesn't capture anything; Zoom records if you enable it

---

## 7. Security

### 7.1 Security Measures

**Data in Transit:**
- ✅ HTTPS/TLS 1.2+ (encrypted connection)
- ✅ Certificate pinning
- ✅ Request signing & validation

**Data at Rest:**
- ✅ AES-256 encryption (field-level)
- ✅ MongoDB Atlas encryption
- ✅ Database encryption
- ✅ Encrypted backups

**Access Control:**
- ✅ Role-based access (least privilege)
- ✅ API authentication on all requests
- ✅ Session timeouts (30 minutes)
- ✅ MFA for admin accounts
- ✅ Audit logging of all data access

**Application Security:**
- ✅ Regular security audits
- ✅ Quarterly penetration tests
- ✅ Code reviews (peer & security)
- ✅ SAST/DAST security scanning
- ✅ Dependency vulnerability monitoring

**Infrastructure Security:**
- ✅ VPC/network segmentation
- ✅ Firewall rules
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Container image scanning

### 7.2 Breach Notification

In the event of a personal data breach:
- **EU (GDPR):** We notify you within 72 hours
- **California (CCPA):** We notify you within 30 days
- **Other:** We notify you without unnecessary delay
- **Notification Includes:** What happened, data affected, steps we took, your options

---

## 8. Your Privacy Rights

### 8.1 General Rights (All Users)

**Right to Access:**
- Request copy of your personal data
- Get in one commonly used format
- Understand how it's used

**Right to Correct:**
- Update inaccurate information
- Complete incomplete data
- Done via account settings or support request

**Right to Delete:**
- Request we delete your data
- Exceptions: legal obligations, legitimate interests
- Processing within 30 days

**Right to Opt-Out:**
- Marketing emails (unsubscribe)
- Analytics tracking (cookies)
- Third-party sharing

### 8.2 EU Users (GDPR Rights)

**Additional Rights:**
- Right to data portability (get data in usable format)
- Right to restrict processing (limit how data used)
- Right to lodge a complaint (with data protection authority)
- Right to object (to certain processing)
- Automated decision making (not subject to solely automated decisions)

**Data Protection Authority:**
- Your country's Data Protection Authority
- Filed complaints taken seriously

### 8.3 California Users (CCPA Rights)

**Consumer Rights:**
- Right to know (what data collected/used)
- Right to delete (request deletion of data)
- Right to opt-out (of data sales/sharing)
- Right to non-discrimination (no penalty for exercising rights)

**Your CA Privacy Rights Request:**
- Email: privacy@specialistly.com
- Submit: Name, email, request type
- Response: Within 45 days (30 days + 15 extension)

### 8.4 Other Jurisdictions

**Canada (PIPEDA):**
- Access to your data
- Correction of inaccurate data
- Deletion upon request
- Opt-out of marketing

**UK (UK GDPR):**
- Same as EU GDPR (post-Brexit alignment)

**Australia (Privacy Act):**
- Access to personal information
- Correction of inaccurate data
- Complaints to Privacy Commissioner

---

## 9. How to Exercise Your Rights

### 9.1 Submit a Request

**Email:** privacy@specialistly.com

**Include:**
- Your name and email
- Type of request (access, delete, correct, etc.)
- Specific data requested
- Date range if applicable

**Your request must:**
- Be clear and specific
- Describe which personal data
- Include enough detail for identification

### 9.2 Response Timeline

| Request Type | Timeline | Notes |
|--------------|----------|-------|
| Access Data | 30 days | May extend 60 days if complex |
| Delete Data | 30 days | May retain if legal obligation |
| Correct Data | 14 days | Updated in system immediately |
| Opt-Out | Immediate | Effective within 24 hours |
| Portability | 30 days | Provided in common format |

### 9.3 Verification

- We may ask for proof of identity
- To verify you're who you claim
- Protects your privacy from fraudulent requests
- Standard practice for all privacy requests

---

## 10. Cookies & Tracking

### 10.1 Types of Cookies

**Session Cookies (Required):**
- Keep you logged in
- Session management
- Expire when you close browser
- Cannot be disabled (required for service)

**Preference Cookies (Optional):**
- Remember your settings
- Language, theme, notifications
- Can be disabled in settings

**Analytics Cookies (Optional):**
- Google Analytics
- Understand how you use the service
- Improve features
- Opt-out anytime

**Third-Party Cookies (Conditional):**
- Zoom (if you connect account)
- Stripe (if you pay)
- SendGrid (analytics)
- Hotjar (optional session replay)

### 10.2 Cookie Preferences

**In Account Settings:**
- Toggle analytics on/off
- Disable marketing cookies
- Choose what data shared
- Change anytime without penalty

**In Browser:**
- Clear cookies anytime
- Disable cookies in settings
- Use private/incognito browsing
- Install cookie management extensions

---

## 11. Third-Party Services

### 11.1 Third Parties We Use

**Zoom (Video Meetings):**
- Privacy Policy: https://zoom.us/privacy
- Data: Stored encrypted, GDPR compliant

**Stripe (Payments):**
- Privacy Policy: https://stripe.com/privacy
- Data: Never stored by us, PCI compliant

**MongoDB Atlas (Database):**
- Privacy Policy: https://www.mongodb.com/legal/privacy
- Data: Encrypted at rest + in transit

**SendGrid (Email):**
- Privacy Policy: https://sendgrid.com/policies/privacy/
- Data: Name, email only

**Google Analytics (Analytics):**
- Privacy Policy: https://policies.google.com/privacy
- Opt-out: https://tools.google.com/dlpage/gaoptout/

**Vercel (Hosting):**
- Privacy Policy: https://vercel.com/legal/privacy-policy
- Data: Frontend hosting only

**Railway (Hosting):**
- Privacy Policy: https://railway.app/legal/privacy
- Data: Backend hosting only

### 11.2 Third-Party Links

Our Service may contain links to third-party websites:
- We're not responsible for their privacy practices
- Read their privacy policies
- We encourage privacy-conscious choices

---

## 12. Children's Privacy

**Our Service is not intended for users under 13.**

- We don't knowingly collect data from children < 13
- If we discover child's data was collected, we delete it immediately
- Parents concerned: email privacy@specialistly.com

**In the US (COPPA):**
- Children's Online Privacy Protection Act applies
- We comply with COPPA requirements
- Verifiable parental consent required for children 13-17

---

## 13. Do Not Track Signals

Some browsers include "Do Not Track" (DNT) headers. 

- We honor DNT signals when possible
- We don't enable tracking by default
- Users can opt-out at any time
- Legitimate operational needs (analytics) still apply

---

## 14. International Data Transfers

### 14.1 Data Transfers

**Where We Store Data:**
- **Primary:** US (MongoDB Atlas, Vercel, Railway)
- **Backup:** Multi-region (EU, US, APAC)
- **Zoom:** Their infrastructure (US-based)
- **Stripe:** Their infrastructure (varies by region)

### 14.2 International Compliance

**EU to US:**
- Data transfer frameworks established
- Standard contractual clauses in place
- Adequacy determinations where available
- Enhanced security measures

**GDPR Compliance:**
- Privacy Shield/Schrems II compliant
- Binding data processing agreements
- User rights protected across borders
- Regular compliance reviews

---

## 15. Changes to Privacy Policy

### 15.1 Policy Updates

**We may update this policy when:**
- Legal requirements change
- Technology changes
- Service features change
- Best practices evolve
- Security protocols update

**When Changes Made:**
- We'll update this page with new effective date
- Notify users via email (for material changes)
- Provide 30-day notice before major changes take effect
- Archived versions available upon request

**Your Options:**
- Review updated policy
- Accept and continue using service
- Discontinue use (no penalty)

---

## 16. Sensitive Information

### 16.1 What We Consider Sensitive

We treat the following as sensitive:
- Social Security numbers
- Passport/ID numbers
- Biometric data
- Financial account information
- Health information
- Racial or ethnic origin
- Religious beliefs
- Political affiliations
- Sexual orientation
- Criminal history

### 16.2 Sensitive Data We Collect

**Intentionally Collected:**
- Payment method (via Stripe security)
- Professional credentials (optional, for specialist verification)

**NEVER Intentionally Collected:**
- Biometric data
- Racial/ethnic information
- Health information
- Political information
- Criminal records

---

## 17. State-Specific Privacy Laws

### 17.1 California (CCPA/CPRA)

**Your Rights:**
- Know: What personal information collected
- Delete: Request deletion of data
- Opt-Out: Of data sales/sharing
- Correct: Inaccurate data
- Restriction: Limit processing

**Specialistly Commitment:**
- We don't sell personal information (as defined by CCPA)
- No discrimination for exercising rights
- Transparent data practices
- Annual privacy certification

### 17.2 Virginia (VCDPA)

**Your Rights:**
- Know what data collected
- Delete personal information
- Correct inaccurate data
- Data portability
- Opt-out of processing

### 17.3 Colorado (CPA)

**Your Rights:**
- Access personal information
- Delete personal data
- Correct inaccurate information
- Data portability
- Opt-out of processing

### 17.4 Connecticut (CTDPA)

**Your Rights:**
- Know what data collected
- Delete personal data
- Correct inaccurate data
- Data portability
- Opt-out of targeted advertising

---

## 18. Contact Information

### 18.1 Privacy Questions

**Email:** privacy@specialistly.com  
**Mail:**
```
Specialistly Inc.
Privacy Team
[Your Company Address]
[City, State, ZIP]
[Country]
```

**Response Time:** 14 business days

### 18.2 Data Protection Officer

**Email:** dpo@specialistly.com  
**Role:** Oversee data protection and GDPR/CCPA compliance

### 18.3 Submit Requests

**Digital Request Form:** https://app.specialistly.com/privacy-request

**Required Information:**
- Full legal name
- Email address
- Description of request
- Verification of identity

### 18.4 Escalations

**Complaint Process:**
1. Email privacy@specialistly.com with concern
2. We investigate and respond within 30 days
3. Escalate to DPO if not satisfied
4. File with data protection authority (your option)

**EU Data Protection Authority:**
- https://edpb.ec.europa.eu/about-edpb/about-edpb_en

**California Attorney General:**
- https://oag.ca.gov/online-privacy-protection-act-oppa

---

## 19. Accountability & Compliance

### 19.1 Our Commitment

- ✅ Transparent data practices
- ✅ User control & consent-based
- ✅ Security-first approach
- ✅ Regular audits & assessments
- ✅ Staff training on privacy
- ✅ Incident response procedures
- ✅ Data protection by design

### 19.2 Certifications

- 🔒 SOC 2 Type 2 Compliant
- 🔒 GDPR Compliant
- 🔒 CCPA Compliant
- 🔒 PCI DSS Level 1 (Payment Processing)

### 19.3 Annual Review

- Privacy policy reviewed annually
- Updated based on user feedback
- Aligned with latest regulations
- Security measures reassessed
- Compliance verified

---

## 20. Glossary

**Personal Data:** Any information relating to an identified or identifiable person

**Processing:** Collection, use, storage, sharing, or deletion of personal data

**GDPR:** General Data Protection Regulation (EU data protection law)

**CCPA:** California Consumer Privacy Act (California data protection law)

**DPA:** Data Protection Authority (government agency overseeing GDPR)

**OAuth:** Secure authorization protocol (used for Zoom connection)

**Encryption:** Converting data to unreadable format for security

**AES-256:** Advanced encryption standard with 256-bit key (military-grade)

**TLS:** Transport Layer Security (HTTPS protocol)

**Cookies:** Small files stored on your device to maintain state

---

## Contact Us

**Questions about this Privacy Policy?**

Email: privacy@specialistly.com  
Website: https://app.specialistly.com  
Phone: +1 (XXX) XXX-XXXX  

---

**Last Updated:** February 19, 2026

**Effective Date:** February 19, 2026

© 2026 Specialistly Inc. All rights reserved.

