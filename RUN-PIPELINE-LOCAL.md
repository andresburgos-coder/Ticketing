# 🚀 Ejecutar Pipeline Localmente

Guía para ejecutar el pipeline de CI localmente en tu máquina antes de hacer push a GitHub.

## 📋 Requisitos

- **Node.js** v20+: [nodejs.org](https://nodejs.org)
- **Docker Desktop**: [docker.com](https://www.docker.com/products/docker-desktop)
- **npm**: Incluido con Node.js

### Verificar instalaciones:
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
docker --version  # Docker version 24.x.x
```

## 🖥️ Windows (PowerShell)

### Opción 1: Ejecutar script PowerShell

```powershell
# Dar permisos de ejecución (primera vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ejecutar el pipeline
.\run-pipeline-local.ps1
```

### Opción 2: Paso a paso manual

```powershell
# 1️⃣ VALIDACIÓN DE CÓDIGO
cd backend
npm ci
npm run format
npm run lint
cd ../frontend
npm ci
npx prettier --check "src/**/*.{ts,html,css}"

# 2️⃣ TESTS UNITARIOS
cd ../backend
npm run test:cov
cd ../frontend
npm test

# 3️⃣ SIMULACIÓN DE DESPLIEGUE
cd ../backend
npm run build
cd ../frontend
npm run build
docker compose config
docker build -t ticketing-backend:local ./backend
docker build -t ticketing-frontend:local ./frontend
docker images | findstr ticketing
```

## 🐧 Linux/Mac (Bash)

### Opción 1: Ejecutar script bash

```bash
# Dar permisos de ejecución
chmod +x run-pipeline-local.sh

# Ejecutar el pipeline
./run-pipeline-local.sh
```

### Opción 2: Paso a paso manual

```bash
# 1️⃣ VALIDACIÓN DE CÓDIGO
cd backend
npm ci
npm run format
npm run lint
cd ../frontend
npm ci
npx prettier --check "src/**/*.{ts,html,css}"

# 2️⃣ TESTS UNITARIOS
cd ../backend
npm run test:cov
cd ../frontend
npm test

# 3️⃣ SIMULACIÓN DE DESPLIEGUE
cd ../backend
npm run build
cd ../frontend
npm run build
docker compose config
docker build -t ticketing-backend:local ./backend
docker build -t ticketing-frontend:local ./frontend
docker images | grep ticketing
```

## 📊 Fases del Pipeline

### Fase 1: 🔍 Validación de Código
```bash
# Backend
npm run format          # Prettier
npm run lint           # ESLint

# Frontend
npx prettier --check   # Prettier
```

### Fase 2: 🧪 Tests Unitarios
```bash
# Backend (Jest)
npm run test:cov       # Tests + Cobertura

# Frontend (Vitest)
npm test               # Tests
```

### Fase 3: 🚀 Simulación de Despliegue
```bash
# Backend Build
npm run build          # Compilar TypeScript

# Frontend Build
npm run build          # Compilar Angular

# Docker
docker compose config  # Validar configuración
docker build ...       # Construir imágenes
```

## 🔧 Troubleshooting

### Error: "npm: command not found"
```bash
# Verifica que Node.js esté instalado
node --version

# Reinstala Node.js desde nodejs.org
```

### Error: "Cannot find module"
```bash
# Limpia node_modules y reinstala
cd backend && rm -rf node_modules && npm ci
cd ../frontend && rm -rf node_modules && npm ci
```

### Error: "Docker daemon is not running"
```bash
# Inicia Docker Desktop o el daemon de Docker
# Windows: Abre Docker Desktop
# Linux: sudo systemctl start docker
# Mac: open /Applications/Docker.app
```

### Error: "ESLint couldn't find a configuration file"
```bash
# Verifica que exista .eslintrc.json en backend y frontend
ls backend/.eslintrc.json
ls frontend/.eslintrc.json
```

### Error: "ENOSPC: no space left on device"
```bash
# Limpia Docker
docker system prune -a
docker volume prune

# O libera espacio en disco
```

### Tests fallan pero necesito continuar
```bash
# Ejecutar script con continue-on-error
# El script ya tiene manejo de errores, pero puedes usar:
npm test || true  # Continúa incluso si falla
```

## 🚀 Workflow Recomendado

1. **Antes de commit**:
   ```bash
   ./run-pipeline-local.ps1  # Windows
   ./run-pipeline-local.sh   # Linux/Mac
   ```

2. **Corregir errores si es necesario**

3. **Hacer commit y push**:
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin tu-rama
   ```

4. **Verificar en GitHub**:
   - Ve a "Actions" en tu repositorio
   - Verifica que el pipeline pase

## 📈 Reportes de Cobertura

Después de ejecutar tests:

### Backend
```bash
# Abrir reporte de cobertura (después de npm run test:cov)
# Windows
start .\backend\coverage\lcov-report\index.html

# Mac
open ./backend/coverage/lcov-report/index.html

# Linux
xdg-open ./backend/coverage/lcov-report/index.html
```

### Frontend
```bash
# Similar para frontend después de npm test
# Windows
start .\frontend\coverage\lcov-report\index.html
```

## 💡 Tips

- **Ejecuta periódicamente**: Antes de cada push
- **Usa SonarQube localmente** (opcional):
  ```bash
  sonar-scanner \
    -Dsonar.projectKey=tu-org_ticketing \
    -Dsonar.sources=. \
    -Dsonar.host.url=https://sonarcloud.io \
    -Dsonar.login=TU_TOKEN
  ```
- **Configura pre-commit hooks** (futuro):
  ```bash
  # Ejecutar pipeline antes de commit automáticamente
  npm install husky lint-staged --save-dev
  npx husky install
  ```

## ✅ Checklist Pre-Push

- [ ] `npm run lint` pasa sin errores críticos
- [ ] `npm run test:cov` pasa con >80% cobertura
- [ ] `npm run build` genera dist/ sin errores
- [ ] `docker compose config` es válido
- [ ] Imágenes Docker se construyen sin error
- [ ] No hay archivos no-staged
- [ ] Rama está actualizada con main/develop

---

**¿Necesitas ayuda?**
Consulta el log de errores y compara con la salida del pipeline en GitHub Actions en la pestaña "Actions".
