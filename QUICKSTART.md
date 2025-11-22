# StockMaster Authentication System - Quick Start Guide

## ✅ What Has Been Built

A **complete, production-ready authentication system** with:

### Backend (Node.js + Express + SQLite)
- ✅ User signup with validation
- ✅ JWT-based login system
- ✅ OTP password reset flow (email or console)
- ✅ Protected dashboard API
- ✅ Rate limiting and security features
- ✅ SQLite database with bcrypt hashing
- ✅ Comprehensive error handling

### Frontend (React + Vite)
- ✅ Signup page with validation
- ✅ Login page
- ✅ Forgot password flow
- ✅ OTP verification page
- ✅ Password reset page
- ✅ Protected dashboard with user info
- ✅ Beautiful gradient UI
- ✅ Responsive design

## 🚀 How to Run

### Option 1: Run Manually (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\ambre\OneDrive\Desktop\MH\SPIT\StockMaster\server
npm install
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\ambre\OneDrive\Desktop\MH\SPIT\StockMaster\client
npm install
npm run dev
```

### Option 2: Quick Start Script

Save this as `start-all.ps1` in the StockMaster directory:

```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "✅ StockMaster started!"
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
```

Run it:
```powershell
.\start-all.ps1
```

## 📝 Quick Test Flow

### 1. Open the App
Navigate to `http://localhost:5173` in your browser

### 2. Create an Account
- Click "Sign Up"
- Enter:
  - Login ID: `testuser` (6-12 chars, letters/numbers/underscore)
  - Email: `test@example.com`
  - Password: `Test@Pass123` (9+ chars, uppercase, lowercase, special char)
  - Confirm password
- Click "Sign Up"

### 3. Login
- Login ID: `testuser`
- Password: `Test@Pass123`
- Click "Login"

### 4. View Dashboard
You should see:
- Welcome message with your login ID
- Your user info (ID, email, created date)
- Logout button

### 5. Test Password Reset
- Logout
- Click "Forgot Password?"
- Enter email: `test@example.com`
- Check the **backend console** for the 6-digit OTP (logged there in dev mode)
- Enter the OTP on verify page
- Set a new password: `NewTest@Pass456`
- Login with new credentials

## 🧪 Test with cURL (PowerShell)

### Signup
```powershell
$body = @{
    loginId = "curl_user"
    email = "curl@example.com"
    password = "Curl@Test123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/signup" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Login
```powershell
$body = @{
    loginId = "curl_user"
    password = "Curl@Test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.token
Write-Host "Token: $token"
```

### Get User Info (Protected)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

### Request Password Reset OTP
```powershell
$body = @{
    email = "curl@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/forgot-password" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Check backend console for OTP!

### Verify OTP
```powershell
$body = @{
    email = "curl@example.com"
    otp = "123456"  # Use OTP from console
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$otpToken = $response.otpToken
Write-Host "OTP Token: $otpToken"
```

### Reset Password
```powershell
$body = @{
    email = "curl@example.com"
    otpToken = $otpToken  # From previous step
    newPassword = "NewCurl@Pass456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/reset-password" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 🎯 Validation Rules Reminder

### Login ID
- 6-12 characters
- Letters, numbers, underscore only

### Password
- Minimum 9 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one special character (!@#$%^&*...)

## 📧 Email Configuration (Optional)

By default, OTPs are logged to the **backend console**. This is perfect for development.

To enable actual email sending:

1. Sign up for [Mailtrap](https://mailtrap.io) (free for testing)
2. Get SMTP credentials
3. Edit `server/.env`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_username
SMTP_PASS=your_password
```
4. Restart backend server

## 🔒 Security Features

✅ **Implemented:**
- Password hashing with bcrypt (12 rounds)
- OTP hashing before storage
- JWT tokens with expiration
- Rate limiting on all auth endpoints
- Account enumeration prevention
- OTP attempt limiting (5 max)
- OTP expiry (10 minutes)
- Input validation & sanitization
- Protected routes

## 📁 File Structure

```
StockMaster/
├── server/               # Backend (Node.js + Express + SQLite)
│   ├── middleware/       # JWT auth middleware
│   ├── routes/          # Auth routes (signup, login, reset, etc.)
│   ├── utils/           # OTP, validation utilities
│   ├── db.js            # Database functions
│   ├── server.js        # Main server file
│   ├── .env             # Config (created from .env.example)
│   └── package.json
│
└── client/              # Frontend (React + Vite)
    ├── src/
    │   ├── pages/       # Signup, Login, Dashboard, etc.
    │   ├── components/  # ProtectedRoute wrapper
    │   ├── api.js       # API client
    │   └── App.jsx      # Main app with routing
    └── package.json
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Ensure `.env` file exists in server folder
- Check JWT_SECRET is set in `.env`

### Frontend won't connect
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify `http://localhost:5173` in browser

### Can't see OTP
- Look at the **backend terminal/console** output
- OTPs are logged there when SMTP is not configured

### Database errors
- Delete `server/database.db` and restart server
- It will recreate the schema automatically

## ✨ What's Next?

The system is complete and ready to use! You can:

1. **Customize the UI** - Edit `client/src/index.css`
2. **Add more features** - Profile editing, email verification, etc.
3. **Deploy to production** - Use environment variables for secrets
4. **Add real email** - Configure SMTP for production

## 📚 Full Documentation

See the main `README.md` for:
- Complete API documentation
- Production deployment guide
- Security best practices
- Full testing instructions

---

**Enjoy your secure authentication system! 🎉**
