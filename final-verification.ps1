# Final Verification - Admin Dashboard Complete Test
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ADMIN DASHBOARD - FINAL VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$adminEmail = "admin@ticketapp.com"
$adminPassword = "Admin123!"

Write-Host "`n1. Testing CSRF Token Endpoint..." -ForegroundColor Yellow
try {
    $csrfResponse = Invoke-RestMethod -Uri "$baseUrl/csrf/token" -Method GET
    Write-Host "   ✅ CSRF Token: $($csrfResponse.csrfToken.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "   ❌ CSRF Token Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Testing Admin Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "X-CSRF-Token" = $csrfResponse.csrfToken
    }

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -Headers $headers
    $accessToken = $loginResponse.accessToken
    
    Write-Host "   ✅ Login Successful" -ForegroundColor Green
    Write-Host "      User: $($loginResponse.user.email)" -ForegroundColor Green
    Write-Host "      Role: $($loginResponse.user.role)" -ForegroundColor Green
    Write-Host "      Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Testing Admin API Endpoints..." -ForegroundColor Yellow

$authHeaders = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$endpoints = @(
    @{ name = "Dashboard Stats"; url = "/admin/dashboard/stats" },
    @{ name = "Users List"; url = "/admin/users?page=1&limit=10" },
    @{ name = "Events Stats"; url = "/admin/events/stats" },
    @{ name = "Tickets List"; url = "/admin/tickets?page=1&limit=10" },
    @{ name = "Reservations"; url = "/admin/reservations?page=1&limit=10" }
)

$successCount = 0
$failCount = 0

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$($endpoint.url)" -Method GET -Headers $authHeaders
        Write-Host "   ✅ $($endpoint.name)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "   ❌ $($endpoint.name): $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n4. Summary" -ForegroundColor Yellow
Write-Host "   Successful: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

Write-Host "`n5. Frontend Access" -ForegroundColor Yellow
Write-Host "   Frontend URL: http://localhost:4200" -ForegroundColor Cyan
Write-Host "   Admin Panel: http://localhost:4200/admin" -ForegroundColor Cyan
Write-Host "   Credentials: $adminEmail / $adminPassword" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
if ($failCount -eq 0) {
    Write-Host "✅ ALL TESTS PASSED - SYSTEM READY!" -ForegroundColor Green
} else {
    Write-Host "⚠️  SOME TESTS FAILED - CHECK ERRORS ABOVE" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
