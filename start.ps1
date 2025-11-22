# StockMaster Quick Start Script
# Run this to start both backend and frontend servers

Write-Host "🚀 Starting StockMaster Authentication System..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "server") -or !(Test-Path "client")) {
    Write-Host "❌ Error: Please run this script from the StockMaster root directory" -ForegroundColor Red
    exit 1
}

# Start backend server in new window
Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Green; npm start"

# Wait for backend to initialize
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# Start frontend in new window
Write-Host "🎨 Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; Write-Host '🎨 Frontend Starting...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✅ StockMaster Started Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:  " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend App: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Check QUICKSTART.md for testing instructions" -ForegroundColor Yellow
Write-Host "📖 Check README.md for full documentation" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 OTPs will be logged to the backend console window" -ForegroundColor Magenta
Write-Host ""
