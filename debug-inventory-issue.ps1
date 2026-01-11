#!/usr/bin/env pwsh

Write-Host "🔍 Debugging Inventory Issue" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Test 1: Check current event availability
Write-Host "`n1. Checking current event availability..." -ForegroundColor Yellow

try {
    $events = Invoke-RestMethod -Uri "http://localhost:3000/api/events" -Method GET
    
    if ($events.Count -gt 0) {
        $event = $events[0]
        Write-Host "✅ Event found: $($event.name)" -ForegroundColor Green
        Write-Host "Event ID: $($event.id)" -ForegroundColor White
        
        if ($event.ticketConfigurations) {
            Write-Host "`nTicket Configurations:" -ForegroundColor White
            foreach ($config in $event.ticketConfigurations) {
                Write-Host "  - Type: $($config.type)" -ForegroundColor Gray
                Write-Host "    Price: $($config.price) $($config.currency)" -ForegroundColor Gray
                Write-Host "    Total: $($config.totalQuantity)" -ForegroundColor Gray
                Write-Host "    Available: $($config.availableQuantity)" -ForegroundColor Yellow
                Write-Host ""
            }
        }
    }
} catch {
    Write-Host "❌ Error getting events: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check database directly (if possible)
Write-Host "`n2. Checking database state..." -ForegroundColor Yellow
Write-Host "Note: This would require direct database access" -ForegroundColor Gray

# Test 3: Simulate a purchase to see what happens
Write-Host "`n3. Testing purchase flow..." -ForegroundColor Yellow

$purchaseData = @{
    eventId = "replace-with-actual-event-id"
    ticketType = "GENERAL"
    quantity = 1
    buyerEmail = "test@example.com"
    paymentInfo = @{
        cardNumber = "4111111111111111"
        expiryDate = "12/25"
        cvv = "123"
    }
} | ConvertTo-Json -Depth 3

Write-Host "Purchase payload:" -ForegroundColor Gray
Write-Host $purchaseData -ForegroundColor Gray

Write-Host "`n⚠️  To test purchase, replace 'replace-with-actual-event-id' with real event ID" -ForegroundColor Yellow

# Test 4: Check for any existing tickets
Write-Host "`n4. Checking existing tickets (requires auth)..." -ForegroundColor Yellow
Write-Host "Note: This requires authentication token" -ForegroundColor Gray

Write-Host "`n🔍 Potential Issues to Check:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "1. Database transaction not committing properly" -ForegroundColor White
Write-Host "2. Frontend cache not refreshing after purchase" -ForegroundColor White
Write-Host "3. WebSocket update not reaching frontend" -ForegroundColor White
Write-Host "4. Race condition between multiple purchases" -ForegroundColor White
Write-Host "5. Event repository save method not persisting changes" -ForegroundColor White
Write-Host "6. Mapper not correctly serializing availableQuantity" -ForegroundColor White

Write-Host "`n🛠️  Debugging Steps:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "1. Check backend logs during purchase" -ForegroundColor White
Write-Host "2. Verify database state before/after purchase" -ForegroundColor White
Write-Host "3. Test WebSocket connection" -ForegroundColor White
Write-Host "4. Check if frontend is using cached data" -ForegroundColor White
Write-Host "5. Verify transaction isolation level" -ForegroundColor White

Write-Host "`n📋 Next Actions:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. Add more detailed logging to purchase use case" -ForegroundColor White
Write-Host "2. Add database transaction wrapper" -ForegroundColor White
Write-Host "3. Implement proper error handling and rollback" -ForegroundColor White
Write-Host "4. Add frontend cache invalidation" -ForegroundColor White
Write-Host "5. Test with concurrent purchases" -ForegroundColor White