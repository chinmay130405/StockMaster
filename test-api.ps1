# StockMaster API Test Script
# Quick test of all authentication endpoints

Write-Host "🧪 StockMaster API Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/auth"
$testUser = @{
    loginId = "testuser_$(Get-Random -Maximum 9999)"
    email = "test_$(Get-Random -Maximum 9999)@example.com"
    password = "Test@Pass123"
}

# Test 1: Signup
Write-Host "1️⃣  Testing Signup..." -ForegroundColor Yellow
try {
    $signupBody = @{
        loginId = $testUser.loginId
        email = $testUser.email
        password = $testUser.password
    } | ConvertTo-Json

    $signupResult = Invoke-RestMethod -Uri "$baseUrl/signup" `
        -Method Post `
        -ContentType "application/json" `
        -Body $signupBody

    Write-Host "   ✅ Signup successful: $($signupResult.message)" -ForegroundColor Green
    Write-Host "   📝 Login ID: $($testUser.loginId)" -ForegroundColor Cyan
    Write-Host "   📧 Email: $($testUser.email)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login
Write-Host "2️⃣  Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        loginId = $testUser.loginId
        password = $testUser.password
    } | ConvertTo-Json

    $loginResult = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResult.token
    Write-Host "   ✅ Login successful" -ForegroundColor Green
    Write-Host "   🔑 Token: $($token.Substring(0,30))..." -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get User Info (Protected)
Write-Host "3️⃣  Testing Protected Endpoint (/me)..." -ForegroundColor Yellow
try {
    $userInfo = Invoke-RestMethod -Uri "$baseUrl/me" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
        }

    Write-Host "   ✅ User info retrieved" -ForegroundColor Green
    Write-Host "   👤 User ID: $($userInfo.user.id)" -ForegroundColor Cyan
    Write-Host "   📝 Login ID: $($userInfo.user.loginId)" -ForegroundColor Cyan
    Write-Host "   📧 Email: $($userInfo.user.email)" -ForegroundColor Cyan
    Write-Host "   📅 Created: $(([DateTimeOffset]::FromUnixTimeMilliseconds($userInfo.user.createdAt)).LocalDateTime)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Get user info failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Forgot Password (Request OTP)
Write-Host "4️⃣  Testing Forgot Password (OTP Request)..." -ForegroundColor Yellow
try {
    $forgotBody = @{
        email = $testUser.email
    } | ConvertTo-Json

    $forgotResult = Invoke-RestMethod -Uri "$baseUrl/forgot-password" `
        -Method Post `
        -ContentType "application/json" `
        -Body $forgotBody

    Write-Host "   ✅ OTP request sent: $($forgotResult.message)" -ForegroundColor Green
    Write-Host "   💡 Check the backend console for the 6-digit OTP!" -ForegroundColor Magenta
} catch {
    Write-Host "   ❌ Forgot password failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Basic API Tests Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check backend console for OTP"
Write-Host "2. Test OTP verification manually:"
Write-Host "   `$otp = '123456'  # Use OTP from console"
Write-Host "   `$body = @{ email='$($testUser.email)'; otp=`$otp } | ConvertTo-Json"
Write-Host "   Invoke-RestMethod -Uri '$baseUrl/verify-otp' -Method Post -ContentType 'application/json' -Body `$body"
Write-Host ""
Write-Host "3. Or test the complete flow in the browser:"
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
