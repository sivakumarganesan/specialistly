# 📸 Specialistly Zoom App Gallery - Image Specifications & Guide

**For Zoom App Marketplace Submission**

---

## Overview

Zoom App Marketplace requires high-quality images to showcase your app. This guide specifies exact requirements and what screenshots to capture.

---

## 1. Image Requirements by Type

### 1.1 App Logo

**Requirements:**
- Size: 512x512 pixels (minimum)
- Format: PNG with transparent background
- File size: < 2 MB
- Color: Full color (RGB)
- Style: Must be recognizable at small sizes (64x64)

**What it is:**
- Your Specialistly app icon/logo
- Displays in Zoom app marketplace listing
- Shows in Zoom connector panel

**Design Tips:**
- Use bold colors (avoid grays/neutrals for marketplace)
- Make it distinctive and memorable
- Should work on both light and dark backgrounds
- Avoid thin lines that pixelate at small sizes

---

### 1.2 Hero/Banner Image

**Requirements:**
- Size: 1280x720 pixels (16:9 aspect ratio)
- Format: PNG or JPG
- File size: < 5 MB
- Color: RGB or CMYK

**What it is:**
- Large banner at top of app marketplace listing
- First impression users see
- Should clearly communicate app purpose

**What to Show:**
- App interface/dashboard (or mockup)
- Key feature highlights
- Specialist + Customer interaction
- Call-to-action text (optional)

**Example Composition:**
```
[Left side: Specialist Dashboard UI]  [Right side: Customer Booking UI]
[Center text: "1:1 Consulting Booking"]
[Bottom: "Integrated with Zoom"]
```

---

### 1.3 App Screenshots (Multiple)

**Requirements:**
- Size: 1024x768 pixels (4:3) OR 1280x720 (16:9)
- Format: PNG or JPG
- File size: < 3 MB each
- Color: RGB

**Quantity:** 2-5 screenshots recommended (Zoom allows up to 8)

**What Each Screenshot Should Show:**

**Screenshot 1: Overview / Main Dashboard**
- Show the specialist dashboard
- Display available features
- Include navigation menu
- Resolution: 1280x720

**Screenshot 2: Booking Flow**
- Customer browsing specialists
- View availability calendar
- Or: completing booking
- Resolution: 1280x720

**Screenshot 3: Meeting Creation**
- Zoom meeting automatically created
- Join link displayed
- Or: confirmation page
- Resolution: 1280x720

**Screenshot 4: Specialist Profile**
- Professional profile display
- Services, rates, reviews
- Call-to-action "Book Now"
- Resolution: 1280x720

**Screenshot 5: Analytics/Dashboard**
- Specialist earnings/stats
- Booking history
- Revenue overview
- Resolution: 1280x720

---

### 1.4 Feature Icons (Optional)

**Requirements:**
- Size: 256x256 pixels each
- Format: PNG with transparent background
- File size: < 500 KB each
- Color: Consistent with branding

**Recommended Feature Icons:**
1. Scheduling/Calendar
2. Video Meeting/Zoom
3. Payment/Billing
4. Reviews/Ratings
5. Analytics/Dashboard
6. Notifications

---

## 2. Recommended Image Content

### 2.1 What to Capture (Screenshots)

**Key Screens to Screenshot:**

1. **Landing/Home Screen**
   - Logo and branding
   - "Welcome to Specialistly" messaging
   - Key value props
   - Sign up / Browse buttons

2. **Specialist Dashboard**
   - Welcome message (logged in)
   - Recent bookings
   - Earnings summary
   - "Go online" / "View Calendar" buttons
   - Navigation menu

3. **Customer Marketplace**
   - Specialist cards with photos/names
   - Search/filter options
   - Ratings/reviews visible
   - "Book Now" buttons

4. **Booking Calendar (Customer View)**
   - Specialist's availability
   - Time slots selectable
   - Pricing visible
   - "Confirm Booking" button

5. **Payment Checkout**
   - Service details
   - Price breakdown
   - Payment method selection
   - Confirmation with Zoom meeting link

6. **Meeting Confirmation**
   - Meeting scheduled message
   - Join link to Zoom
   - Calendar invite option
   - "Add to Calendar" button

7. **Specialist Earnings**
   - Total earnings
   - Monthly breakdown
   - Withdrawal/payment options
   - Analytics chart

8. **Customer Support/Help**
   - FAQ section
   - Contact form
   - Live chat (optional)
   - Troubleshooting guide

---

### 2.2 UI Best Practices for Screenshots

**Preparation Before Screenshots:**

```
☐ Use realistic test data
  ├─ Real specialist profile (your name or sample)
  ├─ Real services listed
  ├─ Real pricing
  └─ Sample customer names (anonymized)

☐ Clean up UI
  ├─ No errors visible
  ├─ No placeholder text
  ├─ No "Loading..." states
  ├─ No test/debug messages
  └─ No email addresses or sensitive data

☐ Optimize for visibility
  ├─ Good lighting (if photos)
  ├─ High contrast text
  ├─ Readable fonts
  ├─ Highlight key features
  └─ Show Zoom integration prominently

☐ Device/Browser
  ├─ Desktop browser (recommended)
  ├─ Full HD resolution (1920x1080)
  ├─ No browser tabs/address bar visible
  ├─ Centered, no sidebar
  └─ Dark mode optional (but consistent)

☐ Branding
  ├─ Specialistly logo visible (if applicable)
  ├─ Brand colors consistent
  ├─ Professional appearance
  └─ No personal info visible
```

---

## 3. Tools to Create Screenshots

### 3.1 Capturing Screenshots

**Option 1: Built-in Tools**
- Windows: Win + Shift + S (Snipping Tool)
- Mac: Cmd + Shift + 4 (Screenshot utility)
- Linux: Print Screen or GNOME Screenshot

**Option 2: Browser Extensions**
- Chrome: Full Page Screen Capture
- Firefox: Firefox Screenshots (built-in)
- Edge: Web Capture (built-in)

**Option 3: Professional Tools**
- Snagit ($49.99) - Professional screenshots
- Camtasia ($99) - Recordings + annotations
- Loom (free) - Video screen captures
- CloudApp (free/paid) - Quick sharing

### 3.2 Editing Screenshots

**Basic Editing:**
- Crop to exact dimensions
- Remove sensitive data (blur/redact)
- Adjust brightness/contrast
- Add arrows/annotations (optional)

**Tools:**
- Canva (free/paid) - Templates + design
- Figma (free/paid) - Professional design
- Photoshop - Advanced editing
- GIMP (free) - Open source alternative

### 3.3 Batch Processing

**Resize/Convert Multiple Images:**

```bash
# Using ImageMagick (install first):
convert input.png -resize 1280x720 output.png

# Windows batch resize:
# Use FastStone Image Resizer or similar

# Mac batch resize:
# Use GraphicConverter or Automator
```

---

## 4. Specific Dimension Cheat Sheet

| Image Type | Dimension | Aspect Ratio | Format |
|------------|-----------|--------------|--------|
| Logo | 512x512 | 1:1 | PNG (transparent) |
| Hero Banner | 1280x720 | 16:9 | PNG/JPG |
| Screenshot | 1024x768 | 4:3 | PNG/JPG |
| Screenshot | 1280x720 | 16:9 | PNG/JPG |
| Feature Icon | 256x256 | 1:1 | PNG (transparent) |
| Thumbnail | 200x200 | 1:1 | PNG/JPG |

**Quick Resize Command (Linux/Mac):**
```bash
# Resize to 1280x720
ffmpeg -i input.png -vf scale=1280:720 output.png

# Or using ImageMagick:
convert input.png -resize 1280x720 output.png
```

---

## 5. What NOT to Include

### ❌ Avoid These in Images:

- Personal information (real names, emails, phone numbers)
- Actual customer data or bookings
- Sensitive financial information
- Passwords or API keys
- Company confidential info
- Watermarks (unless part of brand)
- Out-of-focus or blurry images
- Misleading or fake data
- Competitor logos/branding
- Error messages or failed states
- "Lorem ipsum" placeholder text
- Test/debug mode indicators
- Dated screenshots (if using real dates)

---

## 6. Content Recommendations

### 6.1 Messaging in Screenshots

**If Adding Text Overlays:**

```
Screenshot 1: "Specialist Dashboard"
- "Manage your bookings"
- "Track your earnings"

Screenshot 2: "Customer Booking"
- "Browse specialists"
- "Choose your time"

Screenshot 3: "Zoom Integration"
- "Automatic meeting creation"
- "One-click joining"

Screenshot 4: "Secure Payments"
- "Safe payment processing"
- "Instant payouts"
```

### 6.2 Branding & Colors

**Specialistly Colors (if you have them):**
- Primary: [Your main brand color]
- Secondary: [Accent color]
- Background: Clean white or light gray
- Text: Dark for readability

**Font Recommendations:**
- Headings: Modern sans-serif (Roboto, Inter, Helvetica)
- Body: Clear sans-serif (Open Sans, Ubuntu, Segoe UI)
- Size: Readable even at small sizes (18pt minimum for text)

---

## 7. Creating Images Step-by-Step

### Step 1: Prepare Your App

```
□ Deploy to staging/production
□ Create test specialist account (you)
□ Create test customer account
□ Set up realistic data:
  ├─ Services with descriptions
  ├─ Pricing tiers
  ├─ Available time slots
  ├─ Professional bio/photo
  ├─ Sample customer booking
  └─ Generated Zoom meeting
□ Verify all features working
□ Test on multiple browsers
```

### Step 2: Capture Screenshots

```
□ Desktop browser, full HD resolution
□ Focus on main features
□ 5-8 different screens
□ High quality captures
□ Consistent styling across all
□ Remove all sensitive data
```

### Step 3: Edit Images

```
□ Crop to exact dimensions (1280x720)
□ Adjust brightness/contrast
□ Add optional arrows/highlights
□ Blur/redact sensitive info
□ Add subtle watermark (optional)
□ Save as PNG or high-quality JPG
□ Keep originals for future use
```

### Step 4: Export for Marketplace

```
□ Convert to required format
□ Verify file sizes (< 5 MB)
□ Test that images display correctly
□ Create backup copies
□ Document image descriptions
└─ Ready for Zoom submission
```

---

## 8. Zoom Marketplace Submission Form

### When Submitting Images:

**App Logo:**
- File: `specialistly-logo.png` (512x512)
- Description: "Specialistly app icon"

**Hero/Banner Image:**
- File: `specialistly-banner.png` (1280x720)
- Description: "1:1 Consulting Booking Platform - Integrated with Zoom"

**Screenshots (up to 8):**
- Filename: `screenshot-1.png`, `screenshot-2.png`, etc.
- Description: One sentence per screenshot
  - S1: "Specialist dashboard with earnings and booking management"
  - S2: "Customer marketplace to browse and book specialists"
  - S3: "Booking confirmation with automatic Zoom meeting link"
  - S4: "Specialist profile with services, pricing, and reviews"
  - S5: "Analytics dashboard showing earnings and statistics"

---

## 9. Image Upload Specifications

### Zoom App Dashboard Upload:

```
Logo Upload:
├─ Click "App Icon"
├─ Upload PNG (512x512)
├─ Verify displays correctly
└─ Save

Hero Image Upload:
├─ Click "Hero Image"
├─ Upload PNG/JPG (1280x720)
├─ Position/crop if needed
└─ Save

Screenshots Upload:
├─ Click "Add Screenshot"
├─ Upload PNG/JPG (1024x768 or 1280x720)
├─ Enter description (required)
├─ Reorder if needed (drag & drop)
├─ Can add up to 8 total
└─ Save
```

---

## 10. Quick Checklist

```
BEFORE SUBMITTING TO ZOOM:

□ Logo
  ├─ 512x512 PNG
  ├─ Transparent background
  ├─ Recognizable at small size
  └─ No sensitive data

□ Hero Banner
  ├─ 1280x720
  ├─ Clear, professional
  ├─ Shows app interface
  └─ No PII visible

□ Screenshots (5-8)
  ├─ 1280x720 each
  ├─ High quality
  ├─ Real data (not fake)
  ├─ No errors/debug messages
  ├─ No sensitive data
  ├─ Consistent styling
  └─ Different views of app

□ File Sizes
  ├─ Logo: < 2 MB
  ├─ Banner: < 5 MB
  ├─ Screenshots: < 3 MB each
  └─ All formats: PNG or JPG

□ Content
  ├─ No competitor logos
  ├─ No watermarks (unless branding)
  ├─ No misleading info
  ├─ Professional appearance
  └─ Zoom integration visible

□ Final Check
  ├─ All images display correctly
  ├─ Text is readable
  ├─ Colors accurate
  ├─ Descriptions provided
  └─ Ready for Zoom review
```

---

## 11. Common Mistakes to Avoid

```
❌ Using default placeholder images
❌ Screenshots with development/debug tools visible
❌ Images with blur or poor quality
❌ Incorrect dimensions
❌ Including real customer data with names
❌ Showing error messages or failed states
❌ Inconsistent styling across screenshots
❌ Missing description text
❌ File sizes too large
❌ JPEG quality too low (use PNG for screenshots)
❌ Overly busy layouts that are hard to read
❌ Not showing Zoom integration prominently
```

---

## 12. Resources & Tools

### Free Design Tools:
- Figma: https://figma.com (free tier available)
- Canva: https://canva.com (free + paid)
- GIMP: https://gimp.org (open source)

### Screenshot Tools:
- Snagit: https://techsmith.com/snagit (paid)
- Loom: https://loom.com (free/paid)
- Gyroflow Toolbox: Free screen recording

### Image Optimization:
- TinyPNG: https://tinypng.com (compression)
- ImageOptim: https://imageoptim.com (Mac)
- bulk Resize Photos: https://bulkresizephotos.com

---

## 13. Next Steps

1. **Take Screenshots:**
   - Log in to your Specialistly app
   - Capture 5-8 different screens
   - Focus on key features

2. **Prepare Logo & Banner:**
   - Use your app logo (or create simple one)
   - Design hero banner (1280x720)
   - Can use Canva templates

3. **Edit & Resize:**
   - Crop to exact dimensions
   - Adjust brightness/contrast
   - Export as PNG/JPG

4. **Verify Quality:**
   - Check file sizes
   - Verify dimensions
   - Preview in Zoom dashboard

5. **Submit to Zoom:**
   - Upload in app dashboard
   - Provide descriptions
   - Complete marketplace listing

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Last Updated:** February 19, 2026

