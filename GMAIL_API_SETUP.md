# Gmail API Credentials Setup for Railway

## Problem
The Gmail API requires credentials to send emails. These credentials cannot be committed to GitHub for security reasons, but they need to be available in the Railway production environment.

## Solution
Use the `GOOGLE_CREDENTIALS_BASE64` environment variable to securely deploy credentials to Railway.

## Quick Setup (2 minutes)

### Step 1: Generate Base64-Encoded Credentials

**On Windows (PowerShell):**
```powershell
cd backend
.\deploy-credentials.ps1
```

The script will:
1. Read your local `credentials.json`
2. Encode it to base64
3. Copy the base64 string to your clipboard
4. Display setup instructions

**On Mac/Linux (Bash):**
```bash
cd backend
bash deploy-credentials.sh
```

### Step 2: Set Environment Variable in Railway

1. Go to [railway.app](https://railway.app)
2. Select your project
3. Go to your backend service
4. Click on the **Variables** tab
5. Click **Add Variable**
6. Set:
   - **Name:** `GOOGLE_CREDENTIALS_BASE64`
   - **Value:** Paste the value from the script output (or from clipboard)
7. Click Save
8. Railway will automatically redeploy with the new environment variable

### Step 3: Verify

After deployment, check Railway logs for:
```
✅ Gmail API service initialized successfully
   Method: Service Account (no SMTP timeout issues)
   Scope: Gmail Send API
```

If you see this message, emails are now being sent via Gmail API! 🎉

## How It Works

1. **Locally:** `gmailApiService.js` reads `credentials.json` from the file system
2. **In Railway:** `gmailApiService.js` reads `GOOGLE_CREDENTIALS_BASE64` environment variable, decodes it, and uses it
3. **Gmail API:** Sends emails directly using your service account credentials

## Security

- ✅ Credentials are **never** committed to Git
- ✅ Base64 is just encoding, **not encryption** - Railway environment variables are secure
- ✅ Only the backend can access these credentials
- ✅ Credentials are NOT exposed in logs or application errors

## Troubleshooting

### Error: "Google credentials file not found"
```
Solution: Set GOOGLE_CREDENTIALS_BASE64 in Railway Variables
```

### Error: "Invalid GOOGLE_CREDENTIALS_BASE64 format"
```
Solution: 
1. Re-run the deploy-credentials script
2. Make sure you copied the ENTIRE base64 string
3. Ensure no extra spaces or line breaks were added
```

### Error: "Gmail API initialization failed: permission denied"
```
Solution:
1. Verify the service account JSON file has the correct scopes
2. Ensure the service account has Gmail API enabled in Google Cloud
3. Check that the scopes include: https://www.googleapis.com/auth/gmail.send
```

## Manual Encoding (if scripts don't work)

**Windows (PowerShell):**
```powershell
$content = Get-Content "backend/credentials.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[Convert]::ToBase64String($bytes) | Set-Clipboard
Write-Host "Base64 copied to clipboard!"
```

**Mac/Linux:**
```bash
cat backend/credentials.json | base64 | tr -d '\n' | pbcopy
# Then paste in Railway
```

## FAQ

**Q: Why base64-encode the credentials?**
A: Because environment variables can't easily store multi-line JSON. Base64 encoding makes it a single-line string.

**Q: Is the service account file committed to the repo?**
A: No, it's in `.gitignore` for security. Only committed to GitHub:
- `deploy-credentials.ps1` (Windows script to encode)
- `deploy-credentials.sh` (Linux/Mac script to encode)

**Q: Can I use a different email service?**
A: Yes, but Gmail API is recommended for Railway because:
- No SMTP timeout issues
- Uses existing Google service account
- Highly reliable

**Q: What if I lose the credentials file?**
A: You can download it again from Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. Go to Service Accounts
4. Find your service account → Keys → Download JSON

## Next Steps

1. Run the `deploy-credentials` script
2. Copy the base64 value to Railway
3. Wait for Railway to redeploy
4. Test by booking a webinar
5. Check that customer receives the Zoom appointment email

That's it! 🚀
