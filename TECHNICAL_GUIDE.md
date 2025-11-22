# 🏗️ StockMaster Authentication System - Technical Deep Dive

## 📚 Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Architecture & Flow](#architecture--flow)
3. [How Each Component Works](#how-each-component-works)
4. [Security Implementation](#security-implementation)
5. [Database Design](#database-design)
6. [API Endpoints Explained](#api-endpoints-explained)
7. [Frontend Implementation](#frontend-implementation)

---

## 🎯 Tech Stack Overview

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime for server |
| **Express.js** | 4.18.2 | Web framework for building REST API |
| **SQLite** | - | Lightweight SQL database (file-based) |
| **better-sqlite3** | 9.2.2 | SQLite driver (synchronous, faster) |
| **bcrypt** | 5.1.1 | Password hashing algorithm |
| **jsonwebtoken** | 9.0.2 | JWT token creation & verification |
| **nodemailer** | 6.9.7 | Email sending (OTP delivery) |
| **express-rate-limit** | 7.1.5 | Rate limiting (prevent abuse) |
| **validator** | 13.11.0 | Input validation library |
| **dotenv** | 16.3.1 | Environment variable management |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing |

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI component library |
| **Vite** | 5.0.8 | Fast build tool & dev server |
| **React Router** | 6.20.1 | Client-side routing |
| **Axios** | 1.6.2 | HTTP client for API calls |

---

## 🏛️ Architecture & Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React App (Port 5173/5174)                          │  │
│  │  - Signup/Login/Dashboard Pages                      │  │
│  │  - Form validation                                   │  │
│  │  - JWT token storage (localStorage)                  │  │
│  │  - Protected routes                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests (axios)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express Server (Port 5000)                          │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Middleware Layer                              │ │  │
│  │  │  - CORS                                        │ │  │
│  │  │  - Rate Limiting                               │ │  │
│  │  │  - JWT Authentication                          │ │  │
│  │  │  - Request Logging                             │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Routes (/api/auth/...)                        │ │  │
│  │  │  - signup, login, forgot-password              │ │  │
│  │  │  - verify-otp, reset-password, me              │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Business Logic                                │ │  │
│  │  │  - Validation (email, password, loginId)       │ │  │
│  │  │  - OTP generation & verification               │ │  │
│  │  │  - Password hashing (bcrypt)                   │ │  │
│  │  │  - JWT token generation                        │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SQLite (database.db)                                │  │
│  │  - users table (id, loginId, email, passwordHash)   │  │
│  │  - OTP data (otpHash, otpExpires, otpAttempts)      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SMTP (if configured)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL SERVICE                             │
│  Gmail SMTP / Mailtrap / Console Logging                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 How Each Component Works

### 1. **Signup Flow** 

**Step-by-Step Process:**

```
User fills signup form → Frontend validates → Sends POST request
    ↓
Backend receives data → Server-side validation
    ↓
Check if loginId exists in DB → NO → Continue
                              → YES → Return error "LoginId already taken"
    ↓
Check if email exists in DB → NO → Continue
                            → YES → Return error "Email already registered"
    ↓
Hash password with bcrypt (12 rounds)
    ↓
Insert user into database (loginId, email, passwordHash, createdAt)
    ↓
Return success message → Frontend redirects to login
```

**Code Flow:**
```javascript
// Frontend (Signup.jsx)
const response = await signup(loginId, email, password);
// Uses axios to POST /api/auth/signup

// Backend (routes/auth.js)
router.post('/signup', signupLimiter, async (req, res) => {
  // 1. Validate input (utils/validation.js)
  // 2. Check uniqueness (db.js - getUserByLoginId, getUserByEmail)
  // 3. Hash password (bcrypt.hash)
  // 4. Create user (db.js - createUser)
  // 5. Return success
});
```

### 2. **Login Flow**

**Step-by-Step Process:**

```
User enters loginId & password → Frontend sends POST request
    ↓
Backend receives credentials → Find user by loginId in DB
    ↓
User not found? → Return "Invalid Login Id or Password" (no hints!)
    ↓
User found → Compare password with stored hash using bcrypt
    ↓
Password incorrect? → Return "Invalid Login Id or Password"
    ↓
Password correct → Generate JWT token (contains userId, expires in 7 days)
    ↓
Return token to frontend → Frontend stores in localStorage
    ↓
Frontend redirects to dashboard
```

**JWT Token Structure:**
```javascript
{
  userId: 123,           // From database
  iat: 1700000000,       // Issued at timestamp
  exp: 1700604800        // Expiry timestamp (7 days)
}
// Signed with JWT_SECRET from .env
```

### 3. **Password Reset Flow (OTP)**

**Complete Flow:**

```
STEP 1: Request OTP
User enters email → POST /api/auth/forgot-password
    ↓
Backend checks if user exists → Generate 6-digit OTP (Math.random)
    ↓
Hash OTP with bcrypt → Store otpHash, otpExpires (10 min) in DB
    ↓
Send OTP via email (nodemailer) OR log to console
    ↓
Return generic message (prevent enumeration)

STEP 2: Verify OTP
User enters OTP → POST /api/auth/verify-otp
    ↓
Backend retrieves user → Check OTP expiry → Expired? Error
    ↓
Check attempt count → >=5 attempts? Error
    ↓
Compare OTP with otpHash using bcrypt → Incorrect? Increment attempts, error
    ↓
OTP correct → Generate short-lived JWT token (10 min, type: 'otp-reset')
    ↓
Return otpToken to frontend

STEP 3: Reset Password
User enters new password → POST /api/auth/reset-password
    ↓
Backend verifies otpToken (JWT) → Validate new password strength
    ↓
Hash new password with bcrypt → Update passwordHash in DB
    ↓
Clear OTP data (otpHash, otpExpires, otpAttempts) → Return success
    ↓
Frontend redirects to login
```

### 4. **Protected Routes (Dashboard)**

**How JWT Authentication Works:**

```
User visits /dashboard → Frontend checks localStorage for token
    ↓
No token? → Redirect to /login
    ↓
Token exists → Make request to GET /api/auth/me with Authorization header
    ↓
Backend middleware (authenticateToken) extracts token from header
    ↓
Verify JWT signature & expiry → Invalid/Expired? Return 401 error
    ↓
Token valid → Extract userId from token → Query user from DB
    ↓
User not found? → Return 403 error (token valid but user deleted)
    ↓
User found → Attach user data to request → Continue to route handler
    ↓
Return user info (id, loginId, email, createdAt)
    ↓
Frontend displays dashboard with user info
```

---

## 🔐 Security Implementation

### 1. **Password Security**

**Bcrypt Hashing:**
```javascript
// Signup/Password Reset
const passwordHash = await bcrypt.hash(password, 12);
// 12 rounds = very secure, takes ~250ms to hash

// Login
const isValid = await bcrypt.compare(plainPassword, storedHash);
// Compares in constant time (prevents timing attacks)
```

**Why bcrypt?**
- ✅ Salted automatically (each hash is unique)
- ✅ Slow by design (prevents brute force)
- ✅ Adaptive (can increase rounds as computers get faster)
- ✅ Industry standard

### 2. **JWT Token Security**

**Token Generation:**
```javascript
const token = jwt.sign(
  { userId: user.id },           // Payload (minimal data)
  process.env.JWT_SECRET,        // Secret key (never exposed)
  { expiresIn: '7d' }            // Expiration
);
```

**Token Verification:**
```javascript
jwt.verify(token, JWT_SECRET, (err, decoded) => {
  // Checks signature + expiry
  // Returns userId if valid
});
```

**Security Features:**
- ✅ Signed (tamper-proof)
- ✅ Stateless (no server-side session storage needed)
- ✅ Expirable
- ✅ Contains minimal data (just userId)

### 3. **OTP Security**

**OTP Generation & Storage:**
```javascript
// Generate
const otp = Math.floor(100000 + Math.random() * 900000).toString();
// Result: "847293" (6 digits)

// Hash before storing (never store plaintext!)
const otpHash = await bcrypt.hash(otp, 12);

// Store with expiry
updateUserOTP(email, otpHash, Date.now() + 10 * 60 * 1000);
```

**OTP Verification:**
```javascript
// Check expiry
if (Date.now() > user.otpExpires) {
  return error('OTP expired');
}

// Check attempts
if (user.otpAttempts >= 5) {
  return error('Max attempts exceeded');
}

// Verify OTP
const isValid = await bcrypt.compare(userInputOTP, user.otpHash);
```

### 4. **Rate Limiting**

**Prevents Brute Force Attacks:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // Max 10 requests per window
  message: 'Too many login attempts'
});

router.post('/login', loginLimiter, ...);
```

**Applied to:**
- Signup (5 per hour)
- Login (10 per 15 min)
- Forgot password (5 per hour)
- Verify OTP (10 per 15 min)

### 5. **Input Validation**

**Server-Side Validation (Never trust client!):**
```javascript
// LoginId: 6-12 chars, alphanumeric + underscore
const loginIdRegex = /^[a-zA-Z0-9_]+$/;

// Password: 9+ chars, uppercase, lowercase, special
const hasLowercase = /[a-z]/.test(password);
const hasUppercase = /[A-Z]/.test(password);
const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

// Email: Proper format using 'validator' library
validator.isEmail(email);
```

### 6. **Account Enumeration Prevention**

**Never reveal if user exists:**
```javascript
// Wrong approach:
if (!user) return error("User not found");
if (!passwordValid) return error("Wrong password");

// Correct approach (what we use):
if (!user || !passwordValid) {
  return error("Invalid Login Id or Password");
}
// Same error for both cases!
```

---

## 🗄️ Database Design

### SQLite Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loginId TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  
  -- OTP fields
  otpHash TEXT,
  otpExpires INTEGER,
  otpAttempts INTEGER DEFAULT 0,
  lastOtpRequest INTEGER
);

-- Indexes for fast lookups
CREATE INDEX idx_loginId ON users(loginId);
CREATE INDEX idx_email ON users(email);
```

**Why SQLite?**
- ✅ Serverless (no separate DB process)
- ✅ File-based (easy to backup/move)
- ✅ Perfect for small-medium apps
- ✅ Zero configuration
- ✅ ACID compliant (transactions)

**Database Operations (db.js):**
```javascript
// Uses better-sqlite3 (synchronous)
const db = new Database('database.db');

// Example: Get user
function getUserByLoginId(loginId) {
  const stmt = db.prepare('SELECT * FROM users WHERE loginId = ?');
  return stmt.get(loginId);
}

// Example: Create user
function createUser(loginId, email, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO users (loginId, email, passwordHash, createdAt)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(loginId, email, passwordHash, Date.now());
}
```

---

## 🌐 API Endpoints Explained

### POST `/api/auth/signup`

**Request:**
```json
{
  "loginId": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Process:**
1. Validate inputs
2. Check uniqueness
3. Hash password
4. Insert into DB
5. Return success

**Response:**
```json
{
  "message": "Signup successful"
}
```

### POST `/api/auth/login`

**Request:**
```json
{
  "loginId": "john_doe",
  "password": "SecurePass123!"
}
```

**Process:**
1. Find user by loginId
2. Verify password with bcrypt
3. Generate JWT token
4. Return token

**Response:**
```json
{
  "message": "Login ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/auth/forgot-password`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Process:**
1. Check if user exists (but don't reveal)
2. Generate 6-digit OTP
3. Hash OTP
4. Store otpHash + expiry in DB
5. Send email (or log to console)
6. Return generic message

**Response:**
```json
{
  "message": "If that account exists, an OTP has been sent"
}
```

### POST `/api/auth/verify-otp`

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "847293"
}
```

**Process:**
1. Get user by email
2. Check OTP expiry
3. Check attempt limit
4. Verify OTP with bcrypt
5. Generate short-lived JWT
6. Return otpToken

**Response:**
```json
{
  "message": "OTP verified",
  "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/auth/reset-password`

**Request:**
```json
{
  "email": "john@example.com",
  "otpToken": "eyJhbGci...",
  "newPassword": "NewSecure123!"
}
```

**Process:**
1. Verify otpToken (JWT)
2. Validate new password
3. Hash new password
4. Update DB
5. Clear OTP data
6. Return success

**Response:**
```json
{
  "message": "Password reset successful"
}
```

### GET `/api/auth/me` (Protected)

**Request:**
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Process:**
1. Extract JWT from Authorization header
2. Verify JWT (middleware)
3. Get userId from token
4. Query user from DB
5. Return user info

**Response:**
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

---

## ⚛️ Frontend Implementation

### React Router Setup

**App.jsx:**
```jsx
<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  <Routes>
    <Route path="/signup" element={<Signup />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/verify-otp" element={<VerifyOTP />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    
    {/* Protected route */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
  </Routes>
</Router>
```

### Protected Route Component

**ProtectedRoute.jsx:**
```jsx
function ProtectedRoute({ children }) {
  // Check if JWT token exists in localStorage
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

### API Client (axios)

**api.js:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Automatically attach JWT to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const signup = (loginId, email, password) => 
  api.post('/auth/signup', { loginId, email, password });

export const login = (loginId, password) => 
  api.post('/auth/login', { loginId, password });

// ... more functions
```

### State Management (React useState)

**Login.jsx Example:**
```jsx
function Login() {
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(formData.loginId, formData.password);
      storeToken(response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 📊 Data Flow Example (Complete Login)

```
1. USER ACTION
   User fills login form → Clicks "Login"

2. FRONTEND (Login.jsx)
   handleSubmit() called
   → setLoading(true)
   → await login(loginId, password)

3. API CLIENT (api.js)
   → axios.post('/auth/login', { loginId, password })
   → Request sent to http://localhost:5000/api/auth/login

4. BACKEND (server.js)
   → Express receives request
   → CORS middleware checks origin
   → Rate limiter checks request count
   → Body parser extracts JSON

5. ROUTE HANDLER (routes/auth.js)
   → router.post('/login', loginLimiter, async (req, res) => {})
   → Extract loginId & password from req.body

6. VALIDATION (utils/validation.js)
   → validateLoginId(loginId)
   → Basic checks

7. DATABASE QUERY (db.js)
   → getUserByLoginId(loginId)
   → SQLite query: SELECT * FROM users WHERE loginId = ?

8. PASSWORD VERIFICATION
   → bcrypt.compare(password, user.passwordHash)
   → Returns true/false

9. JWT GENERATION (middleware/auth.js)
   → generateToken(user.id)
   → jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

10. RESPONSE
    → res.json({ message: "Login ok", token: "..." })

11. FRONTEND RECEIVES RESPONSE
    → storeToken(response.token)
    → localStorage.setItem('token', token)
    → navigate('/dashboard')

12. DASHBOARD LOADS
    → ProtectedRoute checks token
    → GET /api/auth/me with Authorization header
    → Backend verifies JWT
    → Returns user info
    → Dashboard displays user data
```

---

## 🎨 Styling Approach

**CSS (index.css):**
- Gradient background (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
- Glass-morphism card design
- Responsive flexbox layouts
- Smooth transitions & hover effects
- Custom form styling
- Alert components (success/error)

**No CSS Framework:**
- Pure CSS3 (no Bootstrap/Tailwind)
- Custom design from scratch
- Lightweight & fast

---

## 🔄 Environment Configuration

**.env File:**
```env
# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here

# Database
DB_FILE=./database.db

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Why .env?**
- ✅ Keeps secrets out of code
- ✅ Different configs per environment (dev/prod)
- ✅ Easy to change without code changes
- ✅ Never committed to Git (.gitignore)

---

## 📈 Performance Considerations

**Backend:**
- Synchronous SQLite (better-sqlite3) → Faster than async
- Connection pooling not needed (file-based DB)
- Rate limiting → Prevents server overload
- JWT → Stateless (no session storage)

**Frontend:**
- Vite → Fast HMR (Hot Module Replacement)
- Code splitting → Only load needed pages
- LocalStorage → Fast token access
- Single Page App → No full page reloads

---

## 🚀 Deployment Considerations

**Production Changes Needed:**

1. **Environment Variables:**
   ```env
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   APP_URL=https://your-domain.com
   ```

2. **HTTPS:**
   - Required for secure JWT transmission
   - Use reverse proxy (nginx) or cloud platform

3. **Database:**
   - Keep SQLite for small apps
   - Migrate to PostgreSQL/MySQL for scale

4. **CORS:**
   - Update origin to production domain
   - Remove localhost wildcards

5. **Rate Limiting:**
   - Use Redis for distributed rate limiting
   - Adjust limits based on traffic

6. **Email:**
   - Use production SMTP (SendGrid, AWS SES)
   - Remove console logging

7. **Monitoring:**
   - Add logging (Winston, Pino)
   - Error tracking (Sentry)
   - Uptime monitoring

---

## 📝 Summary

### What We Built:
- ✅ Complete authentication system
- ✅ 6 backend endpoints (signup, login, reset flow, profile)
- ✅ 6 frontend pages with routing
- ✅ SQLite database with proper schema
- ✅ JWT-based authentication
- ✅ OTP password reset via email
- ✅ Rate limiting & security features
- ✅ Beautiful responsive UI

### Key Technologies:
- **Backend:** Node.js + Express + SQLite + bcrypt + JWT
- **Frontend:** React + Vite + React Router + Axios
- **Security:** Rate limiting, input validation, password hashing, OTP

### Architecture Pattern:
- **REST API** (backend provides endpoints, frontend consumes)
- **SPA** (Single Page Application with client-side routing)
- **JWT Authentication** (stateless, token-based)
- **MVC-ish** (Routes → Controllers → Models pattern)

---

**This is a production-grade authentication system that demonstrates modern web development practices!** 🎉
