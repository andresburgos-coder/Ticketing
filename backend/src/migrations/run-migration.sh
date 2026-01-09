#!/bin/bash
echo "Ejecutando migración de categorías de eventos..."

# Copiar el archivo SQL al contenedor
docker cp backend/src/migrations/add-event-categories.sql ticket-db:/tmp/add-event-categories.sql

# Ejecutar la migración dentro del contenedor
docker exec -it ticket-db psql -U ticket_user -d ticket_sales -f /tmp/add-event-categories.sql

echo "Migración completada!"