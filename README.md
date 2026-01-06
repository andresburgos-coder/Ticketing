# Ticketing
Sistema de Venta de Entradas (Ticketing)

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | NestJS + TypeScript (strict mode) |
| Frontend | Angular 17+ |
| Base de Datos | PostgreSQL 15 |
| ORM | TypeORM |
| Testing | Jest + fast-check |
| Contenedores | Docker + Docker Compose |

## Estructura del Proyecto

```
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── domain/         # Entidades, Value Objects, Interfaces
│   │   ├── application/    # Use Cases, DTOs, Mappers
│   │   ├── infrastructure/ # Repositorios, Adapters
│   │   ├── presentation/   # Controllers
│   │   └── modules/        # NestJS Modules
│   └── test/               # Tests
├── frontend/               # Angular SPA
├── docker/                 # Configuración Docker adicional
└── docker-compose.yml      # Orquestación de servicios
```

## Comandos Docker

### Scripts NPM (Recomendado)

Desde la raíz del proyecto, puedes usar los siguientes scripts npm:

```bash
# Desarrollo
npm run docker:dev              # Iniciar servicios en modo desarrollo
npm run docker:dev:build        # Iniciar con rebuild de imágenes
npm run docker:down             # Detener servicios
npm run docker:down:volumes     # Detener y limpiar volúmenes

# Logs
npm run docker:logs             # Ver todos los logs
npm run docker:logs:backend     # Ver logs del backend
npm run docker:logs:frontend    # Ver logs del frontend
npm run docker:logs:postgres    # Ver logs de PostgreSQL

# Estado y acceso
npm run docker:ps               # Ver estado de servicios
npm run docker:exec:backend     # Acceder al shell del backend
npm run docker:exec:postgres    # Acceder a psql

# Tests
npm run docker:test             # Iniciar con base de datos de prueba
npm run backend:test            # Ejecutar tests unitarios
npm run backend:test:property   # Ejecutar property tests

# Migraciones
npm run backend:migration:run   # Ejecutar migraciones
npm run backend:migration:revert # Revertir última migración

# Producción
npm run docker:prod             # Ejecutar en modo producción
npm run docker:prod:build       # Construir y ejecutar producción
```

### Comandos Docker Compose Directos

```bash
# Iniciar todos los servicios en modo desarrollo
docker-compose up -d

# Ver logs del backend
docker-compose logs -f backend

# Ejecutar tests
docker-compose exec backend npm test

# Ejecutar migraciones
docker-compose exec backend npm run migration:run

# Detener servicios
docker-compose down

# Detener y limpiar volúmenes
docker-compose down -v
```

### Tests con Base de Datos de Prueba

```bash
# Iniciar servicios incluyendo test-db
docker-compose --profile test up -d

# Ejecutar tests E2E
docker-compose exec backend npm run test:e2e
```

### Producción

```bash
# Construir imágenes de producción
docker-compose -f docker-compose.yml -f docker/docker-compose.prod.yml build

# Ejecutar en modo producción
docker-compose -f docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

## Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend | 4200 |
| Backend API | 3000 |
| PostgreSQL | 5432 |
| Test DB | 5433 |

## Variables de Entorno

Copiar `.env.example` a `.env` en el directorio `backend/` y configurar las variables necesarias.
