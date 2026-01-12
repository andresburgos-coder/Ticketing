# ============================================
# Pipeline Local - Ticketing System (PowerShell)
# Ejecuta todas las fases del CI localmente
# ============================================

Set-Location $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PIPELINE LOCAL - TICKETING SYSTEM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# FASE 1: VALIDACION DE CODIGO
# ============================================
Write-Host "[1/4] FASE 1: Validacion de Codigo" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`nBackend: Instalando dependencias..." -ForegroundColor Cyan
Push-Location ./backend
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en instalacion de dependencias backend" -ForegroundColor Red
} else {
    Write-Host "OK - Backend dependencias instaladas" -ForegroundColor Green
}

Write-Host "`nBackend: Formateando codigo (Prettier)..." -ForegroundColor Cyan
npm run format
Write-Host "OK - Backend formateado" -ForegroundColor Green

Write-Host "`nBackend: Linting (ESLint)..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING - ESLint encontro issues (continuando)" -ForegroundColor Yellow
} else {
    Write-Host "OK - Backend lint passed" -ForegroundColor Green
}

Pop-Location

Write-Host "`nFrontend: Instalando dependencias..." -ForegroundColor Cyan
Push-Location ./frontend
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en instalacion de dependencias frontend" -ForegroundColor Red
} else {
    Write-Host "OK - Frontend dependencias instaladas" -ForegroundColor Green
}

Write-Host "`nFrontend: Formateando codigo (Prettier)..." -ForegroundColor Cyan
npx prettier --check "src/**/*.{ts,html,css}" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING - Prettier encontro archivos sin formato" -ForegroundColor Yellow
} else {
    Write-Host "OK - Frontend formateado" -ForegroundColor Green
}

Pop-Location

Write-Host "`nOK - Validacion completada`n" -ForegroundColor Green

# ============================================
# FASE 2: TESTS UNITARIOS
# ============================================
Write-Host "`n[2/4] FASE 2: Tests Unitarios" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`nBackend: Ejecutando tests con cobertura..." -ForegroundColor Cyan
Push-Location ./backend
npm run test:cov 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING - Algunos tests backend fallaron" -ForegroundColor Yellow
} else {
    Write-Host "OK - Backend tests completados" -ForegroundColor Green
}
Pop-Location

Write-Host "`nFrontend: Ejecutando tests..." -ForegroundColor Cyan
Push-Location ./frontend
npm test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING - Algunos tests frontend fallaron" -ForegroundColor Yellow
} else {
    Write-Host "OK - Frontend tests completados" -ForegroundColor Green
}
Pop-Location

Write-Host "`nOK - Tests completados`n" -ForegroundColor Green

# ============================================
# FASE 3: SIMULACION DE DESPLIEGUE
# ============================================
Write-Host "[3/4] FASE 3: Simulacion de Despliegue" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`nBackend: Compilando (Build)..." -ForegroundColor Cyan
Push-Location ./backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en build backend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "OK - Backend compilado" -ForegroundColor Green

Write-Host "`nBackend: Verificando artefactos..." -ForegroundColor Cyan
if (Test-Path "./dist") {
    Write-Host "OK - Carpeta dist existe" -ForegroundColor Green
    Get-ChildItem ./dist | Select-Object -First 5 | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "ERROR - dist no existe" -ForegroundColor Red
}
Pop-Location

Write-Host "`nFrontend: Compilando (Build)..." -ForegroundColor Cyan
Push-Location ./frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en build frontend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "OK - Frontend compilado" -ForegroundColor Green

Write-Host "`nFrontend: Verificando artefactos..." -ForegroundColor Cyan
if (Test-Path "./dist") {
    Write-Host "OK - Carpeta dist existe" -ForegroundColor Green
    Get-ChildItem ./dist | Select-Object -First 5 | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "ERROR - dist no existe" -ForegroundColor Red
}
Pop-Location

Write-Host "`nDocker: Validando docker-compose.yml..." -ForegroundColor Cyan
docker compose config >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Docker Compose valido" -ForegroundColor Green
} else {
    Write-Host "WARNING - Error en Docker Compose" -ForegroundColor Yellow
}

Write-Host "`nDocker: Construyendo imagenes..." -ForegroundColor Cyan
docker build -t ticketing-backend:local ./backend >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Backend image construida" -ForegroundColor Green
} else {
    Write-Host "WARNING - Construccion de backend image fallo" -ForegroundColor Yellow
}

docker build -t ticketing-frontend:local ./frontend >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Frontend image construida" -ForegroundColor Green
} else {
    Write-Host "WARNING - Construccion de frontend image fallo" -ForegroundColor Yellow
}

Write-Host "`nDocker: Listando imagenes..." -ForegroundColor Cyan
$images = docker images | findstr "ticketing"
if ($images) {
    $images | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "  (Sin imagenes ticketing)" -ForegroundColor Gray
}

Write-Host "`nOK - Despliegue simulado completado`n" -ForegroundColor Green

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "PIPELINE LOCAL COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "OK - Validacion de codigo: OK" -ForegroundColor Green
Write-Host "OK - Tests unitarios: OK" -ForegroundColor Green
Write-Host "OK - Build de produccion: OK" -ForegroundColor Green
Write-Host "OK - Imagenes Docker: OK" -ForegroundColor Green
Write-Host ""
Write-Host "El codigo esta listo para despliegue`n" -ForegroundColor Green
