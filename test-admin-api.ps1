# Admin Dashboard API Test Script
Write-Host "=== Admin Dashboard API Test ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$adminEmail = "admin@ticketapp.com"
$adminPassword = "Admin123!"

try {
    # Step 1: Get CSRF Token
    Write-Host "`n1. Getting CSRF token..." -ForegroundColor Yellow
    $csrfResponse = Invoke-RestMethod -Uri "$baseUrl/api/csrf/token" -Method GET
    $csrfToken = $csrfResponse.csrfToken
    Write-Host "✅ CSRF Token: $($csrfToken.Substring(0, 20))..." -ForegroundColor Green

    # Step 2: Login as Admin
    Write-Host "`n2. Logging in as admin..." -ForegroundColor Yellow
    $loginBody = @{
        email = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "X-CSRF-Token" = $csrfToken
    }

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -Headers $headers
    $accessToken = $loginResponse.accessToken
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.email)" -ForegroundColor Green
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Green
    Write-Host "   Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Green

    # Step 3: Test Admin API Endpoints
    Write-Host "`n3. Testing admin API endpoints..." -ForegroundColor Yellow
    
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }

    $endpoints = @(
        "/api/admin/dashboard/stats",
        "/api/admin/users?page=1&limit=10",
        "/api/admin/events/stats",
        "/api/admin/tickets/stats"
    )

    foreach ($endpoint in $endpoints) {
        try {
            Write-Host "   Testing $endpoint..." -ForegroundColor White
            $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method GET -Headers $authHeaders
            Write-Host "   ✅ $endpoint - Success" -ForegroundColor Green
            
            # Show a preview of the response
            $responseJson = $response | ConvertTo-Json -Depth 2
            $preview = if ($responseJson.Length -gt 200) { $responseJson.Substring(0, 200) + "..." } else { $responseJson }
            Write-Host "   Response preview: $preview" -ForegroundColor Gray
        }
        catch {
            Write-Host "   ❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host "`n✅ All tests completed!" -ForegroundColor Green
    Write-Host "Frontend admin panel: http://localhost:4200/admin" -ForegroundColor Cyan
    Write-Host "Backend API docs: http://localhost:3000/api" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")