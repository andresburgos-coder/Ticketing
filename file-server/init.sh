#!/bin/bash

# Script para inicializar y ejecutar el servidor de archivos

echo "================================"
echo "Inicializando Servidor de Archivos"
echo "================================"

# Crear directorio de uploads si no existe
UPLOAD_DIR=${UPLOAD_DIR:-/uploads}
mkdir -p "$UPLOAD_DIR"

# Crear subdirectorios de categorías
mkdir -p "$UPLOAD_DIR/events"
mkdir -p "$UPLOAD_DIR/users"
mkdir -p "$UPLOAD_DIR/tickets"
mkdir -p "$UPLOAD_DIR/general"

echo "✓ Directorios de upload creados en: $UPLOAD_DIR"

# Verificar si existen node_modules
if [ ! -d "node_modules" ]; then
  echo "↳ Instalando dependencias..."
  npm install
  echo "✓ Dependencias instaladas"
fi

# Iniciar el servidor
echo "↳ Iniciando servidor en puerto ${PORT:-3001}..."
npm start
