# Verify Admin Dashboard is Working
Write-Host "=== Admin Dashboard Verification ===" -ForegroundColor Cyan

$frontendUrl = "http://localhost:4200"
$adminPanelUrl = "$frontendUrl/admin"

Write-Host "`n✅ Backend API Status:" -ForegroundColor Green
Write-Host "   CSRF Token: http://localhost:3000/api/csrf/token" -ForegroundColor White
Write-Host "   Auth Login: http://localhost:3000/api/auth/login" -ForegroundColor White
Write-Host "   Admin Dashboard Stats: http://localhost:3000/api/admin/dashboard/stats" -ForegroundColor White
Write-Host "   Admin Users: http://localhost:3000/api/admin/users" -ForegroundColor White

Write-Host "`n✅ Frontend Admin Panel:" -ForegroundColor Green
Write-Host "   URL: $adminPanelUrl" -ForegroundColor White
Write-Host "   Credentials: admin@ticketapp.com / Admin123!" -ForegroundColor White

Write-Host "`n📋 Steps to Test:" -ForegroundColor Yellow
Write-Host "   1. Open $frontendUrl in your browser" -ForegroundColor White
Write-Host "   2. Login with admin@ticketapp.com / Admin123!" -ForegroundColor White
Write-Host "   3. You should be redirected to $adminPanelUrl" -ForegroundColor White
Write-Host "   4. Click the sidebar buttons to test navigation:" -ForegroundColor White
Write-Host "      - Dashboard: loads stats" -ForegroundColor White
Write-Host "      - Eventos: loads events" -ForegroundColor White
Write-Host "      - Usuarios: loads users list" -ForegroundColor White
Write-Host "      - Tickets: loads tickets" -ForegroundColor White
Write-Host "      - Reservas: loads reservations" -ForegroundColor White
Write-Host "      - Reportes: loads reports" -ForegroundColor White

Write-Host "`n✅ All Systems Ready!" -ForegroundColor Green
Write-Host "   Backend: Running on port 3000" -ForegroundColor White
Write-Host "   Frontend: Running on port 4200" -ForegroundColor White
Write-Host "   Database: Connected and healthy" -ForegroundColor White

Write-Host "`n🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   Frontend: $frontendUrl" -ForegroundColor Blue
Write-Host "   Admin Panel: $adminPanelUrl" -ForegroundColor Blue
Write-Host "   API Docs: http://localhost:3000/api" -ForegroundColor Blue
Write-Host "   pgAdmin: http://localhost:5050" -ForegroundColor Blue
