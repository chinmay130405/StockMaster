# StockMaster Authentication System

A complete, production-ready authentication system with secure user signup, login, OTP-based password reset, and protected dashboard. Built with Node.js, Express, SQLite, and React.

## 🎯 Features

- ✅ **Secure User Signup** with strict validation
- ✅ **JWT-based Authentication** with protected routes
- ✅ **OTP Password Reset** via email (with console fallback)
- ✅ **Rate Limiting** to prevent brute-force attacks
- ✅ **SQLite Database** with bcrypt password hashing
- ✅ **Protected Dashboard** with user info
- ✅ **Clean React UI** with responsive design
- ✅ **Comprehensive Validation** on both client and server

## 📋 Validation Rules

### Login ID
- 6-12 characters
- Letters, numbers, and underscore only
- Must be unique

### Email
- Valid email format
- Must be unique

### Password
- Minimum 9 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one special character (!@#$%^&*...)

### OTP
- 6-digit numeric code
- Expires in 10 minutes
- Maximum 5 attempts per OTP
- Rate-limited to prevent spam

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- npm or yarn

### Installation

#### 1. Clone or navigate to the project

```powershell
cd C:\Users\ambre\OneDrive\Desktop\MH\SPIT\StockMaster
```

#### 2. Setup Backend

```powershell
cd server
npm install
```

Copy the environment template and configure:

```powershell
cp .env.example .env
```

Edit `.env` file with your settings (see Configuration section below).

Start the server:

```powershell
npm start
```

Or use nodemon for development:

```powershell
npm run dev
```

The server will run on `http://localhost:5000`

#### 3. Setup Frontend

Open a new terminal:

```powershell
cd client
npm install
npm run dev
```

The client will run on `http://localhost:5173`

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
OTP_JWT_EXPIRES_IN=10m

# Database
DB_FILE=./database.db

# SMTP (Optional for development)
# Leave empty to log OTPs to console
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@stockmaster.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=5
```

**Important Security Notes:**
- Change `JWT_SECRET` to a strong random string in production
- Never commit `.env` to version control
- Use HTTPS in production

### Frontend Environment Variables (Optional)

Create `client/.env` if you need to override the API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### POST `/api/auth/signup`
Register a new user.

**Request:**
```json
{
  "loginId": "john_doe",
  "email": "john@example.com",
  "password": "Secr3t!Pass"
}
```

**Success Response (200):**
```json
{
  "message": "Signup successful"
}
```

**Error Response (400):**
```json
{
  "error": "LoginId already taken"
}
```

### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "loginId": "john_doe",
  "password": "Secr3t!Pass"
}
```

**Success Response (200):**
```json
{
  "message": "Login ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid Login Id or Password"
}
```

### POST `/api/auth/forgot-password`
Request OTP for password reset.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):** (always returns same message to prevent enumeration)
```json
{
  "message": "If that account exists, an OTP has been sent"
}
```

### POST `/api/auth/verify-otp`
Verify OTP and receive reset token.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified",
  "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "error": "Invalid or expired OTP. 4 attempts remaining."
}
```

### POST `/api/auth/reset-password`
Reset password using OTP token.

**Request:**
```json
{
  "email": "john@example.com",
  "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPass!234"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful"
}
```

### GET `/api/auth/me`
Get current user info (protected route).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "loginId": "john_doe",
    "email": "john@example.com",
    "createdAt": 1700000000000
  }
}
```

## 🧪 Testing with cURL

### 1. Signup a new user

```powershell
curl -X POST http://localhost:5000/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{\"loginId\":\"test_user\",\"email\":\"test@example.com\",\"password\":\"Test@Pass123\"}'
```

### 2. Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"loginId\":\"test_user\",\"password\":\"Test@Pass123\"}'
```

Save the returned token.

### 3. Access protected endpoint

```powershell
curl -X GET http://localhost:5000/api/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test password reset flow

**Request OTP:**
```powershell
curl -X POST http://localhost:5000/api/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\"}'
```

Check your server console for the OTP (if SMTP not configured).

**Verify OTP:**
```powershell
curl -X POST http://localhost:5000/api/auth/verify-otp `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"otp\":\"123456\"}'
```

Save the returned `otpToken`.

**Reset Password:**
```powershell
curl -X POST http://localhost:5000/api/auth/reset-password `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"otpToken\":\"YOUR_OTP_TOKEN\",\"newPassword\":\"NewTest@Pass456\"}'
```

**Login with new password:**
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"loginId\":\"test_user\",\"password\":\"NewTest@Pass456\"}'
```

## 🔒 Security Features

### Implemented
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ OTP hashing before database storage
- ✅ JWT tokens with configurable expiration
- ✅ Rate limiting on all auth endpoints
- ✅ Account enumeration prevention (generic error messages)
- ✅ OTP attempt limiting (5 max per OTP)
- ✅ OTP expiry (10 minutes)
- ✅ User cooldown between OTP requests (1 minute)
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Protected routes with JWT verification

### Production Recommendations
- 🔐 Use HTTPS in production
- 🔐 Store JWT in httpOnly cookies instead of localStorage
- 🔐 Implement refresh token rotation
- 🔐 Add email verification on signup
- 🔐 Implement account lockout after failed login attempts
- 🔐 Use environment-specific secrets
- 🔐 Enable database backups
- 🔐 Add logging and monitoring
- 🔐 Implement CSRF protection
- 🔐 Use helmet.js for additional security headers

## 📧 Email Configuration

### Development (Console Logging)
Leave SMTP variables empty in `.env`. OTPs will be logged to the server console.

### Testing with Mailtrap
1. Sign up for free at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials
3. Update `.env`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

### Testing with Ethereal Email
1. Visit [ethereal.email](https://ethereal.email)
2. Create test account
3. Use provided SMTP credentials in `.env`

### Production (Real SMTP)
Use services like:
- SendGrid
- AWS SES
- Mailgun
- Postmark

Update `.env` with production SMTP credentials.

## 📁 Project Structure

```
StockMaster/
├── server/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   └── auth.js          # Authentication routes
│   ├── utils/
│   │   ├── otp.js           # OTP generation & email
│   │   └── validation.js    # Input validation
│   ├── db.js                # SQLite database utilities
│   ├── server.js            # Express server setup
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── client/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Signup.jsx
    │   │   ├── Login.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── VerifyOTP.jsx
    │   │   ├── ResetPassword.jsx
    │   │   └── Dashboard.jsx
    │   ├── api.js           # API utilities
    │   ├── App.jsx          # Main app component
    │   ├── main.jsx         # React entry point
    │   └── index.css        # Global styles
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .gitignore
```

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loginId TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  otpHash TEXT,
  otpExpires INTEGER,
  otpAttempts INTEGER DEFAULT 0,
  lastOtpRequest INTEGER
);
```

## 🎨 Frontend Pages

- `/` - Redirects to login
- `/signup` - User registration
- `/login` - User login
- `/forgot-password` - Request password reset OTP
- `/verify-otp` - Verify OTP code
- `/reset-password` - Set new password
- `/dashboard` - Protected user dashboard

## 🐛 Troubleshooting

### Database Issues
- Delete `database.db` and restart server to recreate schema
- Check file permissions in server directory

### CORS Errors
- Ensure frontend is running on `http://localhost:5173`
- Check `CLIENT_URL` in server `.env`

### JWT Errors
- Ensure `JWT_SECRET` is set in server `.env`
- Check token expiration settings

### OTP Not Received
- Check server console for logged OTP (development mode)
- Verify SMTP credentials if using email
- Check spam folder

### Port Conflicts
- Change `PORT` in server `.env`
- Change port in client `vite.config.js`

## 📝 License

ISC

## 👨‍💻 Author

StockMaster Development Team

---

**Built with ❤️ using Node.js, Express, SQLite, and React**
