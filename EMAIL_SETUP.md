# 📧 Email Configuration Guide for StockMaster

## Current Setup (Development Mode)

**Right now, OTPs are logged to the backend console.**

When you request a password reset:
1. Click "Forgot Password" on the frontend
2. Enter your email
3. **Check the backend terminal** (where `npm start` is running)
4. Look for the 6-digit OTP printed in the console
5. Copy the OTP and use it on the verify page

---

## Option 1: Gmail SMTP (Real Emails)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"

### Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Name it: "StockMaster"
5. Click "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update .env File

Edit `server/.env` and update these lines:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password-here
EMAIL_FROM=your-gmail@gmail.com
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM=john.doe@gmail.com
```

### Step 4: Restart Backend Server

Stop the backend (Ctrl+C) and restart:
```powershell
cd C:\Users\ambre\OneDrive\Desktop\MH\SPIT\StockMaster\server
npm start
```

### Step 5: Test

1. Request password reset from frontend
2. Check your Gmail inbox (or spam folder)
3. Use the OTP from email

---

## Option 2: Mailtrap (Testing - Free, No Real Emails)

**Best for development/testing without sending real emails**

### Step 1: Create Account
1. Go to https://mailtrap.io
2. Sign up for free
3. Create an inbox

### Step 2: Get Credentials
1. Click on your inbox
2. Select "SMTP Settings"
3. Copy the credentials

### Step 3: Update .env

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
EMAIL_FROM=noreply@stockmaster.com
```

### Step 4: Restart & Test

Restart backend and request OTP. Check Mailtrap inbox online.

---

## Option 3: Keep Using Console (Easiest)

**No configuration needed - just check the backend terminal!**

### Where to Find OTP:

Look at the terminal where you ran the backend server. After requesting OTP, you'll see:

```
============================================================
🔐 OTP FOR DEVELOPMENT
============================================================
Email: test@example.com
OTP: 847293
Expires in: 10 minutes
============================================================
```

### Quick Test Flow:

1. **Frontend**: Enter email on forgot password page → Click "Send OTP"
2. **Backend Console**: Look for the OTP (6 digits)
3. **Frontend**: Enter the OTP on verify page
4. **Frontend**: Set new password
5. **Done!** ✅

---

## Troubleshooting

### Gmail SMTP Not Working

**Error: "Invalid login credentials"**
- Make sure you created an **App Password** (not your regular Gmail password)
- Remove spaces from the app password: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

**Error: "Less secure app access"**
- Use App Password (2FA + App Password method)
- Don't use "Less secure app access" (deprecated by Google)

### OTP Not in Inbox

- **Check spam folder**
- Wait 30-60 seconds (delivery may be delayed)
- Check backend console for any error messages
- Verify SMTP credentials are correct

### Still Using Console

If SMTP configuration fails, the system **automatically falls back to console logging**, so you can always continue testing!

---

## Recommended Setup

**For Development:**
→ Use console logging (default, no config needed)

**For Testing:**
→ Use Mailtrap (free, catches emails without sending)

**For Production:**
→ Use Gmail SMTP or professional service (SendGrid, AWS SES, Mailgun)

---

## Current Status

✅ OTP system is working  
✅ OTPs are logged to console (default)  
⚙️ Configure SMTP to send real emails (optional)  

**You can use the system right now by checking the backend console for OTPs!**
