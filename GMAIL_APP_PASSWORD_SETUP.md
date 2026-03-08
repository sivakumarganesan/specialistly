# Gmail App Password Setup Guide

This document explains how to set up Gmail App Password authentication for Specialistly email service.

## Why App Password?

Google discontinued "Less secure app access" and now requires either:
1. **Gmail App Password** (Recommended ✅) - Secure, modern, requires 2FA
2. OAuth 2.0 (Complex setup)

We use **Gmail App Password** - the simplest and most secure option.

---

## Setup Steps

### Step 1: Enable 2-Factor Authentication

1. Go to: **https://myaccount.google.com/security**
2. Sign in with your Gmail account
3. Find **"2-Step Verification"** section
4. Click **"Get started"** and follow Google's verification steps
5. You'll need to verify using your phone

### Step 2: Generate App Password

1. Go to: **https://myaccount.google.com/apppasswords**
2. You should see a dropdown menu that says "Select the app and device you want to generate the app password for"
3. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your platform)
4. Click **Generate**
5. Google will display a **16-character password** like: `abcd efgh ijkl mnop`
6. **Copy this password** (don't include the spaces when pasting)

### Step 3: Set Environment Variables

Update your environment variables with:

**Local Development (.env):**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Production (Railway):**
1. Go to Railway Dashboard
2. Click on your Specialistly project
3. Go to **Variables**
4. Add or update:
   - `GMAIL_USER` = your-email@gmail.com
   - `GMAIL_APP_PASSWORD` = abcdefghijklmnop

### Step 4: Restart Your Application

After setting variables:
1. Restart your backend service
2. Wait 2-3 minutes for changes to propagate through Google's systems
3. Test with: `GET /api/health/email-test?sendTest=your-email@example.com`

---

## Important Notes

⚠️ **Critical Details:**

- **Never use your actual Gmail password** - Always use the 16-character App Password
- **No spaces in password** - If you see spaces, remove them when pasting
- **2FA is required** - You must have 2-Step Verification enabled
- **Don't commit passwords** - Keep them in environment variables only
- **Google sync delay** - Wait 2-3 minutes after generating a new password

---

## Troubleshooting

### Error: "Invalid login" or "535 auth fail"

1. **Verify 2FA is enabled:**
   - Go to https://myaccount.google.com/security
   - Ensure 2-Step Verification shows as "On"

2. **Generate a fresh App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail / Windows Computer
   - Generate a new password
   - Copy the FULL 16-character password (with any hyphens)

3. **Update your variables:**
   - Set `GMAIL_APP_PASSWORD` to the new password
   - Do NOT include spaces

4. **Restart and wait:**
   - Restart your backend application
   - Wait 2-3 minutes
   - Try again

### Testing Email Service

To test if your Gmail is set up correctly:

```bash
curl "//your-domain/api/health/email-test?sendTest=test@example.com"
```

This will:
1. Verify the SMTP connection works
2. Send a test email to your specified address
3. Return detailed error messages if anything fails

### Verify Endpoint

Check connection without sending an email:

```bash
curl "//your-domain/api/health/email-test"
```

---

## Example Setup for specialistlyapp@gmail.com

If you have the email account `specialistlyapp@gmail.com`:

1. **Go to:** https://myaccount.google.com/security
   - Sign in as: specialistlyapp@gmail.com
   - Enable 2-Step Verification

2. **Go to:** https://myaccount.google.com/apppasswords
   - Generate password for Mail / Windows Computer
   - You'll get something like: `ncqj hpqr wznt xyzz`

3. **Set environment variables:**
   ```
   GMAIL_USER=specialistlyapp@gmail.com
   GMAIL_APP_PASSWORD=ncqjhpqrwzntxyzz
   ```
   (Remove spaces when pasting)

4. **Restart backend** and test with `/api/health/email-test`

---

## More Information

- **Google Account Security:** https://myaccount.google.com/security
- **App Passwords:** https://myaccount.google.com/apppasswords
- **Gmail Security Settings:** https://myaccount.google.com/less-secure-apps
- **Google Support:** https://support.google.com/accounts/answer/185833
