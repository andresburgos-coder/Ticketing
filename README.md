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

### Desarrollo

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
